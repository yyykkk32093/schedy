import type { IChatChannelRepository } from '@/domains/chat/domain/repository/IChatChannelRepository.js'

interface GetOrCreateCommunityChannelInput {
    communityId: string
    userId: string
}

interface GetOrCreateCommunityChannelOutput {
    channelId: string
    type: string
    communityId: string | null
}

/**
 * コミュニティのチャットチャンネルを取得（なければ自動作成）
 * メンバーシップ確認は API 層（authMiddleware / コントローラー）で実施
 */
export class GetOrCreateCommunityChannelUseCase {
    constructor(
        private readonly channelRepository: IChatChannelRepository,
    ) { }

    async execute(input: GetOrCreateCommunityChannelInput): Promise<GetOrCreateCommunityChannelOutput> {
        let channel = await this.channelRepository.findByCommunityId(input.communityId)
        if (!channel) {
            channel = await this.channelRepository.createCommunityChannel(input.communityId)
        }
        return {
            channelId: channel.id,
            type: channel.type,
            communityId: channel.communityId,
        }
    }
}
