import type { IChatChannelRepository } from '@/domains/chat/domain/repository/IChatChannelRepository.js'

interface GetOrCreateActivityChannelInput {
    activityId: string
    userId: string
}

interface GetOrCreateActivityChannelOutput {
    channelId: string
    type: string
    activityId: string | null
}

/**
 * アクティビティのチャットチャンネルを取得（なければ自動作成）
 * アクティビティ存在確認 + メンバーシップ確認は API 層で実施
 */
export class GetOrCreateActivityChannelUseCase {
    constructor(
        private readonly channelRepository: IChatChannelRepository,
    ) { }

    async execute(input: GetOrCreateActivityChannelInput): Promise<GetOrCreateActivityChannelOutput> {
        let channel = await this.channelRepository.findByActivityId(input.activityId)
        if (!channel) {
            channel = await this.channelRepository.createActivityChannel(input.activityId)
        }
        return {
            channelId: channel.id,
            type: channel.type,
            activityId: channel.activityId,
        }
    }
}
