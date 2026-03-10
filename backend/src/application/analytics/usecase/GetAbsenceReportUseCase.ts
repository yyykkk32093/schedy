import type { PrismaClient } from '@prisma/client'

// ─── 型定義 ──────────────────────────────────────────────

export interface AbsenceReportInput {
    communityId: string
    /** 絞り込み開始日（ISO 8601）。省略時は3か月前 */
    from?: string
    /** 絞り込み終了日（ISO 8601）。省略時は今日 */
    to?: string
}

export interface AbsenceItem {
    participationId: string
    scheduleId: string
    activityTitle: string
    scheduleDate: string // "YYYY-MM-DD"
    userId: string
    displayName: string | null
    cancelledAt: string // ISO 8601
    isSameDayCancel: boolean
}

export interface AbsenceSummary {
    totalCancellations: number
    sameDayCancellations: number
    /** ユーザーごとのキャンセル回数（多い順） */
    frequentCancellers: Array<{
        userId: string
        displayName: string | null
        cancelCount: number
        sameDayCancelCount: number
    }>
}

export interface AbsenceReportOutput {
    communityId: string
    summary: AbsenceSummary
    items: AbsenceItem[]
}

// ─── UseCase ─────────────────────────────────────────────

/**
 * GetAbsenceReportUseCase — 欠席・当日キャンセル分析（UBL-18）
 */
export class GetAbsenceReportUseCase {
    constructor(private readonly prisma: PrismaClient) { }

    async execute(input: AbsenceReportInput): Promise<AbsenceReportOutput> {
        const { communityId } = input

        const now = new Date()
        const fromDate = input.from
            ? new Date(input.from)
            : new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        const toDate = input.to ? new Date(input.to) : now

        const cancellations = await this.prisma.participation.findMany({
            where: {
                status: 'CANCELLED',
                cancelledAt: { not: null },
                schedule: {
                    activity: { communityId, deletedAt: null },
                    date: { gte: fromDate, lte: toDate },
                },
            },
            select: {
                id: true,
                scheduleId: true,
                userId: true,
                cancelledAt: true,
                schedule: {
                    select: {
                        date: true,
                        activity: { select: { title: true } },
                    },
                },
            },
            orderBy: { cancelledAt: 'desc' },
        })

        // ユーザー名を一括取得
        const userIds = [...new Set(cancellations.map((c) => c.userId))]
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, displayName: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u.displayName]))

        // アイテム生成 + 当日キャンセル判定
        const items: AbsenceItem[] = cancellations.map((c) => {
            const scheduleDate = new Date(c.schedule.date)
            const cancelDate = new Date(c.cancelledAt!)
            const isSameDay =
                scheduleDate.getFullYear() === cancelDate.getFullYear() &&
                scheduleDate.getMonth() === cancelDate.getMonth() &&
                scheduleDate.getDate() === cancelDate.getDate()

            return {
                participationId: c.id,
                scheduleId: c.scheduleId,
                activityTitle: c.schedule.activity.title,
                scheduleDate: scheduleDate.toISOString().slice(0, 10),
                userId: c.userId,
                displayName: userMap.get(c.userId) ?? null,
                cancelledAt: c.cancelledAt!.toISOString(),
                isSameDayCancel: isSameDay,
            }
        })

        // サマリ
        const totalCancellations = items.length
        const sameDayCancellations = items.filter((i) => i.isSameDayCancel).length

        // 常習者ランキング
        const cancelCountByUser = new Map<
            string,
            { total: number; sameDay: number }
        >()
        for (const item of items) {
            const entry = cancelCountByUser.get(item.userId) ?? {
                total: 0,
                sameDay: 0,
            }
            entry.total++
            if (item.isSameDayCancel) entry.sameDay++
            cancelCountByUser.set(item.userId, entry)
        }

        const frequentCancellers = [...cancelCountByUser.entries()]
            .map(([userId, counts]) => ({
                userId,
                displayName: userMap.get(userId) ?? null,
                cancelCount: counts.total,
                sameDayCancelCount: counts.sameDay,
            }))
            .sort((a, b) => b.cancelCount - a.cancelCount)
            .slice(0, 20) // 上位20名

        return {
            communityId,
            summary: {
                totalCancellations,
                sameDayCancellations,
                frequentCancellers,
            },
            items,
        }
    }
}
