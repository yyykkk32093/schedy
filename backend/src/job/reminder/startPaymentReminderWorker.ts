/**
 * PaymentReminderWorker — 支払いリマインダー定期ジョブ
 *
 * 未払い参加者に対して通知を送信する。
 *
 * 対象:
 *   - Participation.paymentStatus = 'UNPAID'
 *   - Schedule.date が今日以降 ～ 3日後以内（直近のスケジュール）
 *   - 1日1回だけリマインダー（同日に重複送信しない）
 *
 * 実行間隔: 1日1回（通常朝 9:00 に cron で呼び出し）
 */
import { loadEnv } from '@/_sharedTech/config/loadEnv.js'
import path from 'path'

loadEnv({ envDir: path.resolve(process.cwd(), 'env') })

import { prisma } from '@/_sharedTech/db/client.js'
import { logger } from '@/_sharedTech/logger/logger.js'
import { randomUUID } from 'crypto'

const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24時間
const DAYS_AHEAD = 3 // 3日先までのスケジュールが対象

let shuttingDown = false

interface UnpaidParticipation {
    id: string
    userId: string
    scheduleId: string
    schedule: {
        id: string
        date: Date
        participationFee: number | null
        activity: {
            id: string
            title: string
            community: {
                id: string
                grade: string
                reminderEnabled: boolean
            }
        }
    }
}

async function runOnce(): Promise<void> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const cutoff = new Date(today.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000)

    // 未払い参加者を取得（コミュニティ設定を含む）
    const unpaidParticipations = await prisma.participation.findMany({
        where: {
            paymentStatus: 'UNPAID',
            status: 'ATTENDING',
            schedule: {
                date: { gte: today, lte: cutoff },
                status: 'SCHEDULED',
                participationFee: { not: null },
            },
        },
        include: {
            schedule: {
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
                },
            },
        },
    }) as unknown as UnpaidParticipation[]

    if (unpaidParticipations.length === 0) {
        logger.info('💰 No unpaid participants found for upcoming schedules')
        return
    }

    logger.info(
        { count: unpaidParticipations.length },
        '💰 Found unpaid participants — sending reminders',
    )

    // 同日重複防止: 今日既に SCHEDULE_REMINDER 通知を送信済みのユーザー+スケジュールを取得
    const todayStart = today
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    const existingReminders = await prisma.notification.findMany({
        where: {
            type: 'PAYMENT_REMINDER',
            createdAt: { gte: todayStart, lt: todayEnd },
        },
        select: { userId: true, referenceId: true },
    })
    const alreadySent = new Set(
        existingReminders.map((r) => `${r.userId}:${r.referenceId}`),
    )

    let sentCount = 0

    for (const p of unpaidParticipations) {
        const key = `${p.userId}:${p.scheduleId}`
        if (alreadySent.has(key)) continue

        // reminderEnabled=false のコミュニティはスキップ
        if (!p.schedule.activity.community.reminderEnabled) continue

        const fee = p.schedule.participationFee ?? 0
        const dateStr = p.schedule.date.toLocaleDateString('ja-JP')
        const notificationId = randomUUID()
        const title = '参加費の支払いリマインダー'
        const body = `${p.schedule.activity.title}（${dateStr}）の参加費 ¥${fee.toLocaleString()} が未払いです。`
        const isPremium = p.schedule.activity.community.grade === 'PREMIUM'

        if (isPremium) {
            // PREMIUM: Notification + OutboxEvent を同一 TX で作成 → FCM プッシュ送信
            await prisma.$transaction(async (tx) => {
                await tx.notification.create({
                    data: {
                        id: notificationId,
                        userId: p.userId,
                        type: 'PAYMENT_REMINDER',
                        title,
                        body,
                        referenceId: p.scheduleId,
                        referenceType: 'SCHEDULE',
                    },
                })
                await tx.outboxEvent.create({
                    data: {
                        id: randomUUID(),
                        idempotencyKey: `notification:${notificationId}`,
                        aggregateId: p.userId,
                        eventName: 'NotificationCreated',
                        eventType: 'notification.payment_reminder',
                        routingKey: 'notification.push',
                        payload: {
                            notificationId,
                            targetUserId: p.userId,
                            type: 'PAYMENT_REMINDER',
                            title,
                            body,
                            referenceId: p.scheduleId,
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
                    userId: p.userId,
                    type: 'PAYMENT_REMINDER',
                    title,
                    body,
                    referenceId: p.scheduleId,
                    referenceType: 'SCHEDULE',
                },
            })
        }

        sentCount++
    }

    logger.info({ sentCount }, '💰 Payment reminders sent')
}

async function loop(): Promise<void> {
    logger.info('💰 PaymentReminderWorker started')

    while (!shuttingDown) {
        try {
            await runOnce()
        } catch (err) {
            logger.error({ err }, '❌ PaymentReminderWorker error')
        }
        await new Promise((resolve) => setTimeout(resolve, REMINDER_INTERVAL_MS))
    }

    logger.info('🛑 PaymentReminderWorker stopped')
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
