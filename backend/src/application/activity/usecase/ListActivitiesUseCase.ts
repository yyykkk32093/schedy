import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'

export class ListActivitiesUseCase {
    constructor(
        private readonly activityRepository: IActivityRepository,
        private readonly scheduleRepository: IScheduleRepository,
    ) { }

    async execute(input: { communityId: string }): Promise<{
        activities: Array<{
            id: string
            communityId: string
            title: string
            description: string | null
            defaultLocation: string | null
            defaultStartTime: string | null
            defaultEndTime: string | null
            organizerUserId: string | null
            createdBy: string
            upcomingSchedules: Array<{
                date: string
                startTime: string
                endTime: string
            }>
        }>
    }> {
        const activities = await this.activityRepository.findsByCommunityId(input.communityId)

        // バッチで upcoming スケジュールを取得
        const activityIds = activities.map((a) => a.getId().getValue())
        const upcomingMap = await this.scheduleRepository.findUpcomingByActivityIds(activityIds)

        return {
            activities: activities.map((a) => {
                const upcoming = upcomingMap.get(a.getId().getValue()) ?? []
                return {
                    id: a.getId().getValue(),
                    communityId: a.getCommunityId().getValue(),
                    title: a.getTitle().getValue(),
                    description: a.getDescription()?.getValue() ?? null,
                    defaultLocation: a.getDefaultLocation()?.getValue() ?? null,
                    defaultAddress: a.getDefaultAddress(),
                    defaultStartTime: a.getDefaultStartTime()?.getValue() ?? null,
                    defaultEndTime: a.getDefaultEndTime()?.getValue() ?? null,
                    organizerUserId: a.getOrganizerUserId()?.getValue() ?? null,
                    createdBy: a.getCreatedBy().getValue(),
                    upcomingSchedules: upcoming.map((s) => ({
                        date: s.getDate().toISOString().slice(0, 10),
                        startTime: s.getStartTime().getValue(),
                        endTime: s.getEndTime().getValue(),
                    })),
                }
            }),
        }
    }
}
