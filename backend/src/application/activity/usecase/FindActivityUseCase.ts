import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import { ActivityNotFoundError } from '../error/ActivityNotFoundError.js'

export class FindActivityUseCase {
    constructor(
        private readonly activityRepository: IActivityRepository,
        private readonly userRepository: IUserRepository,
        private readonly communityRepository: ICommunityRepository,
    ) { }

    async execute(input: { activityId: string }): Promise<{
        id: string
        communityId: string
        title: string
        description: string | null
        defaultLocation: string | null
        defaultAddress: string | null
        defaultStartTime: string | null
        defaultEndTime: string | null
        recurrenceRule: string | null
        organizerUserId: string | null
        organizerDisplayName: string | null
        createdBy: string
        createdByDisplayName: string | null
        communityPaymentSettings: {
            enabledPaymentMethods: string[]
            paypayId: string | null
            stripeAccountId: string | null
        }
    }> {
        const activity = await this.activityRepository.findById(input.activityId)
        if (!activity) throw new ActivityNotFoundError()

        const createdByUserId = activity.getCreatedBy().getValue()
        const user = await this.userRepository.findById(createdByUserId)

        // 幹事の displayName を取得
        const organizerUserId = activity.getOrganizerUserId()?.getValue() ?? null
        let organizerDisplayName: string | null = null
        if (organizerUserId) {
            if (organizerUserId === createdByUserId) {
                organizerDisplayName = user?.getDisplayName()?.getValue() ?? null
            } else {
                const organizerUser = await this.userRepository.findById(organizerUserId)
                organizerDisplayName = organizerUser?.getDisplayName()?.getValue() ?? null
            }
        }

        // コミュニティの支払い設定を取得
        const community = await this.communityRepository.findById(
            activity.getCommunityId().getValue(),
        )

        return {
            id: activity.getId().getValue(),
            communityId: activity.getCommunityId().getValue(),
            title: activity.getTitle().getValue(),
            description: activity.getDescription()?.getValue() ?? null,
            defaultLocation: activity.getDefaultLocation()?.getValue() ?? null,
            defaultAddress: activity.getDefaultAddress(),
            defaultStartTime: activity.getDefaultStartTime()?.getValue() ?? null,
            defaultEndTime: activity.getDefaultEndTime()?.getValue() ?? null,
            recurrenceRule: activity.getRecurrenceRule(),
            organizerUserId,
            organizerDisplayName,
            createdBy: createdByUserId,
            createdByDisplayName: user?.getDisplayName()?.getValue() ?? null,
            communityPaymentSettings: {
                enabledPaymentMethods: community?.getEnabledPaymentMethods() ?? ['CASH'],
                paypayId: community?.getPayPayId() ?? null,
                stripeAccountId: community?.getStripeAccountId() ?? null,
            },
        }
    }
}
