import type { PrismaClient } from '@prisma/client'

// ─── 型定義 ──────────────────────────────────────────────

export interface ParticipationTrendInput {
    communityId: string
    /** 集計開始月（YYYY-MM）。省略時は12か月前から */
    from?: string
    /** 集計終了月（YYYY-MM）。省略時は当月 */
    to?: string
}

export interface TrendPoint {
    month: string // "YYYY-MM"
    uniqueParticipants: number
    totalAttendances: number
    newParticipants: number
}

export interface ParticipationTrendOutput {
    communityId: string
    trend: TrendPoint[]
}

// ─── UseCase ─────────────────────────────────────────────

/**
 * GetParticipationTrendUseCase — 月別参加者推移（UBL-19）
 */
export class GetParticipationTrendUseCase {
    constructor(private readonly prisma: PrismaClient) { }

    async execute(input: ParticipationTrendInput): Promise<ParticipationTrendOutput> {
        const { communityId } = input

        // デフォルト: 直近12か月
        const now = new Date()
        const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        const fromDate = input.from
            ? new Date(`${input.from}-01`)
            : defaultFrom
        const toDate = input.to
            ? new Date(`${input.to}-01`)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0) // 当月末

        const activityIds = await this.prisma.activity
            .findMany({
                where: { communityId, deletedAt: null },
                select: { id: true },
            })
            .then((rows) => rows.map((r) => r.id))

        if (activityIds.length === 0) {
            return { communityId, trend: [] }
        }

        // 月別ユニーク参加者 + 合計参加数
        const rows = await this.prisma.$queryRaw<
            Array<{
                month: string
                unique_participants: bigint
                total_attendances: bigint
            }>
        >`
            SELECT
                TO_CHAR(s."date", 'YYYY-MM')    AS month,
                COUNT(DISTINCT p."userId")       AS unique_participants,
                COUNT(p."id")                    AS total_attendances
            FROM "Schedule" s
            JOIN "Participation" p
                ON p."scheduleId" = s."id" AND p."status" = 'ATTENDING'
            WHERE s."activityId" = ANY(${activityIds})
              AND s."date" >= ${fromDate}
              AND s."date" <= ${toDate}
            GROUP BY TO_CHAR(s."date", 'YYYY-MM')
            ORDER BY month
        `

        // 新規参加者（その月に初めて参加した人数）
        const newRows = await this.prisma.$queryRaw<
            Array<{ month: string; new_participants: bigint }>
        >`
            WITH first_participation AS (
                SELECT
                    p."userId",
                    MIN(s."date") AS first_date
                FROM "Participation" p
                JOIN "Schedule" s ON s."id" = p."scheduleId"
                WHERE s."activityId" = ANY(${activityIds})
                  AND p."status" = 'ATTENDING'
                GROUP BY p."userId"
            )
            SELECT
                TO_CHAR(fp.first_date, 'YYYY-MM') AS month,
                COUNT(*)                           AS new_participants
            FROM first_participation fp
            WHERE fp.first_date >= ${fromDate}
              AND fp.first_date <= ${toDate}
            GROUP BY TO_CHAR(fp.first_date, 'YYYY-MM')
            ORDER BY month
        `

        const newMap = new Map(
            newRows.map((r) => [r.month, Number(r.new_participants)]),
        )

        const trend: TrendPoint[] = rows.map((row) => ({
            month: row.month,
            uniqueParticipants: Number(row.unique_participants),
            totalAttendances: Number(row.total_attendances),
            newParticipants: newMap.get(row.month) ?? 0,
        }))

        return { communityId, trend }
    }
}
