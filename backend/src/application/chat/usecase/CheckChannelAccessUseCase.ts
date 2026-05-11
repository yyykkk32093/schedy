import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IChatChannelRepository } from '@/domains/chat/domain/repository/IChatChannelRepository.js'
import type { IDMChannelRepository } from '@/domains/chat/domain/repository/IDMChannelRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'

export type ChannelAccessResult =
    | { granted: true }
    | { granted: false; code: 'CHANNEL_NOT_FOUND' | 'FORBIDDEN'; message: string }

/**
 * 指定ユーザーがチャンネルに参加できるかチェックする。
 * - DM: DMParticipant に存在するか
 * - COMMUNITY/ACTIVITY: 該当コミュニティにアクティブなメンバーシップがあるか
 */
export class CheckChannelAccessUseCase {
    constructor(
        private readonly chatChannelRepository: IChatChannelRepository,
        private readonly dmChannelRepository: IDMChannelRepository,
        private readonly activityRepository: IActivityRepository,
        private readonly membershipRepository: ICommunityMembershipRepository,
    ) { }

    async execute(input: { channelId: string; userId: string }): Promise<ChannelAccessResult> {
        const channel = await this.chatChannelRepository.findById(input.channelId)
        if (!channel) {
            return { granted: false, code: 'CHANNEL_NOT_FOUND', message: 'チャンネルが見つかりません' }
        }

        if (channel.type === 'DM') {
            const ok = await this.dmChannelRepository.isParticipant(input.channelId, input.userId)
            if (!ok) {
                return { granted: false, code: 'FORBIDDEN', message: 'このDMにアクセスする権限がありません' }
            }
            return { granted: true }
        }

        let communityId = channel.communityId
        if (channel.type === 'ACTIVITY' && channel.activityId) {
            const activity = await this.activityRepository.findByIdIncludingDeleted(channel.activityId)
            communityId = activity?.getCommunityId().getValue() ?? null
        }
        if (communityId) {
            const membership = await this.membershipRepository.findByCommunityAndUser(communityId, input.userId)
            if (!membership || !membership.isActive()) {
                return { granted: false, code: 'FORBIDDEN', message: 'このチャンネルにアクセスする権限がありません' }
            }
        }

        return { granted: true }
    }
}
