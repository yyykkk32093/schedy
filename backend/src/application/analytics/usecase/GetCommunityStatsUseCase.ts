import type { PrismaClient } from '@prisma/client'

// ─── 型定義 ──────────────────────────────────────────────

export interface CommunityStatsInput {
    communityId: string
}

export interface ActivityStats {
    activityId: string
    activityTitle: string
    totalSchedules: number
    totalAttending: number
    totalCancelled: number
    attendanceRate: number // 0–100
}

export interface MonthlyStats {
    month: string // "YYYY-MM"
    totalSchedules: number
    totalAttending: number
    attendanceRate: number
}

export interface CommunityStatsOutput {
    communityId: string
    totalMembers: number
    totalActivities: number
    totalSchedules: number
    totalParticipations: number
    overallAttendanceRate: number
    byActivity: ActivityStats[]
    byMonth: MonthlyStats[]
}

// ─── UseCase ─────────────────────────────────────────────

/**
 * GetCommunityStatsUseCase — コミュニティの統計情報を集計（UBL-17）
 *
 * PREMIUM grade のみ。requireCommunityFeature('ANALYTICS_REPORT') でガード。
 */
export class GetCommunityStatsUseCase {
    constructor(private readonly prisma: PrismaClient) { }

    async execute(input: CommunityStatsInput): Promise<CommunityStatsOutput> {
        const { communityId } = input

        // ── 基本カウント ──
        const [totalMembers, activities] = await Promise.all([
            this.prisma.communityMembership.count({
                where: { communityId, leftAt: null },
            }),
            this.prisma.activity.findMany({
                where: { communityId, deletedAt: null },
                select: { id: true, title: true },
            }),
        ])

        const activityIds = activities.map((a) => a.id)

        if (activityIds.length === 0) {
            return {
                communityId,
                totalMembers,
                totalActivities: 0,
                totalSchedules: 0,
                totalParticipations: 0,
                overallAttendanceRate: 0,
                byActivity: [],
                byMonth: [],
            }
        }

        // ── Activity 別集計 ──
        const byActivity: ActivityStats[] = []

        for (const activity of activities) {
            const schedules = await this.prisma.schedule.findMany({
                where: { activityId: activity.id },
                select: {
                    id: true,
                    capacity: true,
                    _count: { select: { participations: true } },
                },
            })

            const scheduleIds = schedules.map((s) => s.id)
            if (scheduleIds.length === 0) {
                byActivity.push({
                    activityId: activity.id,
                    activityTitle: activity.title,
                    totalSchedules: 0,
                    totalAttending: 0,
                    totalCancelled: 0,
                    attendanceRate: 0,
                })
                continue
            }

            const [attending, cancelled] = await Promise.all([
                this.prisma.participation.count({
                    where: { scheduleId: { in: scheduleIds }, status: 'ATTENDING' },
                }),
                this.prisma.participation.count({
                    where: { scheduleId: { in: scheduleIds }, status: 'CANCELLED' },
                }),
            ])

            const total = attending + cancelled
            byActivity.push({
                activityId: activity.id,
                activityTitle: activity.title,
                totalSchedules: scheduleIds.length,
                totalAttending: attending,
                totalCancelled: cancelled,
                attendanceRate: total > 0 ? Math.round((attending / total) * 100) : 0,
            })
        }

        // ── 月別集計（Native SQL） ──
        const monthlyRows = await this.prisma.$queryRaw<
            Array<{ month: string; total_schedules: bigint; total_attending: bigint }>
        >`
            SELECT
                TO_CHAR(s."date", 'YYYY-MM') AS month,
                COUNT(DISTINCT s."id")        AS total_schedules,
                COUNT(p."id")                 AS total_attending
            FROM "Schedule" s
            LEFT JOIN "Participation" p
                ON p."scheduleId" = s."id" AND p."status" = 'ATTENDING'
            WHERE s."activityId" = ANY(${activityIds})
            GROUP BY TO_CHAR(s."date", 'YYYY-MM')
            ORDER BY month
        `

        const byMonth: MonthlyStats[] = monthlyRows.map((row) => {
            const totalSchedules = Number(row.total_schedules)
            const totalAttending = Number(row.total_attending)
            // 各月の参加率 = 参加者数 / (スケジュール数 * メンバー数) ※ メンバー数で割ると低くなりすぎるので、ここではスケジュールあたりの平均参加者数を rate として返す
            return {
                month: row.month,
                totalSchedules,
                totalAttending,
                attendanceRate:
                    totalSchedules > 0
                        ? Math.round((totalAttending / totalSchedules) * 10) / 10
                        : 0,
            }
        })

        // ── 全体集計 ──
        const totalSchedules = byActivity.reduce((sum, a) => sum + a.totalSchedules, 0)
        const totalParticipations = byActivity.reduce((sum, a) => sum + a.totalAttending, 0)
        const totalAll = byActivity.reduce(
            (sum, a) => sum + a.totalAttending + a.totalCancelled,
            0,
        )
        const overallAttendanceRate =
            totalAll > 0 ? Math.round((totalParticipations / totalAll) * 100) : 0

        return {
            communityId,
            totalMembers,
            totalActivities: activities.length,
            totalSchedules,
            totalParticipations,
            overallAttendanceRate,
            byActivity,
            byMonth,
        }
    }
}
