import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { PrismaClient } from '@prisma/client'

export interface UserScheduleItem {
    scheduleId: string
    date: string
    startTime: string
    endTime: string
    location: string | null
    status: string
    participationFee: number | null
    activityId: string
    activityTitle: string
    communityId: string
    communityName: string
}

/**
 * ユーザーが所属する全コミュニティのスケジュールを日付範囲で横断取得する
 *
 * ドメインモデルの集約境界（Schedule → Activity → Community）を跨ぐ Read 専用クエリのため、
 * Prisma の JOIN を直接使用する（CQRS の Query 側パターン）。
 */
export class ListUserSchedulesUseCase {
    constructor(
        private readonly membershipRepository: ICommunityMembershipRepository,
        private readonly prisma: PrismaClient,
    ) { }

    async execute(input: {
        userId: string
        from: string   // 'YYYY-MM-DD'
        to: string     // 'YYYY-MM-DD'
    }): Promise<{ schedules: UserScheduleItem[] }> {
        // 1. ユーザーが所属するコミュニティ一覧を取得
        const memberships = await this.membershipRepository.findsByUserId(input.userId)
        const communityIds = memberships.map((m) => m.getCommunityId().getValue())

        if (communityIds.length === 0) {
            return { schedules: [] }
        }

        // 2. JOIN クエリでスケジュールを横断取得
        const rows = await this.prisma.schedule.findMany({
            where: {
                activity: {
                    communityId: { in: communityIds },
                    deletedAt: null,
                },
                date: {
                    gte: new Date(input.from),
                    lte: new Date(input.to),
                },
            },
            include: {
                activity: {
                    select: {
                        id: true,
                        title: true,
                        communityId: true,
                        community: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' },
            ],
        })

        return {
            schedules: rows.map((row) => ({
                scheduleId: row.id,
                date: row.date.toISOString().split('T')[0],
                startTime: row.startTime,
                endTime: row.endTime,
                location: row.location,
                status: row.status,
                participationFee: row.participationFee,
                activityId: row.activity.id,
                activityTitle: row.activity.title,
                communityId: row.activity.communityId,
                communityName: row.activity.community.name,
            })),
        }
    }
}
