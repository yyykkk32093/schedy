/**
 * ScheduleReminderWorker — スケジュール開始前リマインダー定期ジョブ
 *
 * 参加確定者に対してスケジュール開始前リマインドを送信する。
 *
 * 対象:
 *   - Schedule.status = 'SCHEDULED'
 *   - Schedule.date が明日（1日後）
 *   - Participation.status = 'ATTENDING'
 *   - 1日1回だけリマインダー（同日に重複送信しない）
 *
 * 実行間隔: 1日1回（通常朝にcronで呼び出し）
 */
import { loadEnv } from '@/_sharedTech/config/loadEnv.js'
import path from 'path'

loadEnv({ envDir: path.resolve(process.cwd(), 'env') })

import { prisma } from '@/_sharedTech/db/client.js'
import { logger } from '@/_sharedTech/logger/logger.js'
import { randomUUID } from 'crypto'

const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24時間

let shuttingDown = false

interface UpcomingSchedule {
    id: string
    date: Date
    startTime: string
    location: string | null
    activity: {
        id: string
        title: string
        community: {
            id: string
            grade: string
            reminderEnabled: boolean
        }
    }
    participations: Array<{
        id: string
        userId: string
        status: string
    }>
}

async function runOnce(): Promise<void> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    // 明日のスケジュールが対象
    const tomorrow = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)
    const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)

    // 明日開催のスケジュールと参加者を取得（コミュニティ設定を含む）
    const upcomingSchedules = await prisma.schedule.findMany({
        where: {
            status: 'SCHEDULED',
            date: { gte: tomorrow, lt: dayAfterTomorrow },
        },
        include: {
            activity: {
                select: {
                    id: true,
                    title: true,
                    community: {
                        select: { id: true, grade: true, reminderEnabled: true },
                    },
                },
            },
            participations: {
                where: { status: 'ATTENDING' },
                select: { id: true, userId: true, status: true },
            },
        },
    }) as unknown as UpcomingSchedule[]

    if (upcomingSchedules.length === 0) {
        logger.info('📅 No upcoming schedules found for tomorrow')
        return
    }

    // 対象参加者を集計（reminderEnabled=false のコミュニティはスキップ）
    const allParticipants: Array<{ userId: string; scheduleId: string; schedule: UpcomingSchedule }> = []
    for (const schedule of upcomingSchedules) {
        if (!schedule.activity.community.reminderEnabled) continue
        for (const p of schedule.participations) {
            allParticipants.push({ userId: p.userId, scheduleId: schedule.id, schedule })
        }
    }

    if (allParticipants.length === 0) {
        logger.info('📅 No attending participants for tomorrow schedules')
        return
    }

    logger.info(
        { scheduleCount: upcomingSchedules.length, participantCount: allParticipants.length },
        '📅 Found upcoming schedules — sending reminders',
    )

    // 同日重複防止: 今日既に SCHEDULE_REMINDER 通知を送信済みのものを取得
    const todayStart = today
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    const existingReminders = await prisma.notification.findMany({
        where: {
            type: 'SCHEDULE_REMINDER',
            createdAt: { gte: todayStart, lt: todayEnd },
        },
        select: { userId: true, referenceId: true },
    })
    const alreadySent = new Set(
        existingReminders.map((r) => `${r.userId}:${r.referenceId}`),
    )

    let sentCount = 0

    for (const { userId, scheduleId, schedule } of allParticipants) {
        const key = `${userId}:${scheduleId}`
        if (alreadySent.has(key)) continue

        const dateStr = schedule.date.toLocaleDateString('ja-JP')
        const locationStr = schedule.location ? `（場所: ${schedule.location}）` : ''
        const notificationId = randomUUID()
        const title = '明日のスケジュールリマインダー'
        const body = `${schedule.activity.title}（${dateStr} ${schedule.startTime}）${locationStr}`
        const isPremium = schedule.activity.community.grade === 'PREMIUM'

        if (isPremium) {
            // PREMIUM: Notification + OutboxEvent を同一 TX で作成 → FCM プッシュ送信
            await prisma.$transaction(async (tx) => {
                await tx.notification.create({
                    data: {
                        id: notificationId,
                        userId,
                        type: 'SCHEDULE_REMINDER',
                        title,
                        body,
                        referenceId: scheduleId,
                        referenceType: 'SCHEDULE',
                    },
                })
                await tx.outboxEvent.create({
                    data: {
                        id: randomUUID(),
                        idempotencyKey: `notification:${notificationId}`,
                        aggregateId: userId,
                        eventName: 'NotificationCreated',
                        eventType: 'notification.schedule_reminder',
                        routingKey: 'notification.push',
                        payload: {
                            notificationId,
                            targetUserId: userId,
                            type: 'SCHEDULE_REMINDER',
                            title,
                            body,
                            referenceId: scheduleId,
                            referenceType: 'SCHEDULE',
                        },
                        occurredAt: new Date(),
                        status: 'PENDING',
                    },
                })
            })
        } else {
            // FREE: DB 通知のみ（プッシュなし）
            await prisma.notification.create({
                data: {
                    id: notificationId,
                    userId,
                    type: 'SCHEDULE_REMINDER',
                    title,
                    body,
                    referenceId: scheduleId,
                    referenceType: 'SCHEDULE',
                },
            })
        }

        sentCount++
    }

    logger.info({ sentCount }, '📅 Schedule reminders sent')
}

async function loop(): Promise<void> {
    logger.info('📅 ScheduleReminderWorker started')

    while (!shuttingDown) {
        try {
            await runOnce()
        } catch (err) {
            logger.error({ err }, '❌ ScheduleReminderWorker error')
        }
        await new Promise((resolve) => setTimeout(resolve, REMINDER_INTERVAL_MS))
    }

    logger.info('🛑 ScheduleReminderWorker stopped')
}

process.on('SIGINT', () => {
    logger.warn('🛑 SIGINT received')
    shuttingDown = true
})
process.on('SIGTERM', () => {
    logger.warn('🛑 SIGTERM received')
    shuttingDown = true
})

loop()
