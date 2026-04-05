import type { DMChannelListItem, IDMChannelRepository } from '@/domains/chat/domain/repository/IDMChannelRepository.js'

/**
 * DM チャンネル一覧取得 UseCase
 *
 * ユーザーが参加している DM チャンネルを最新メッセージ付きで返す。
 */
export class ListDMChannelsUseCase {
    constructor(private readonly dmChannelRepo: IDMChannelRepository) { }

    async execute(userId: string): Promise<DMChannelListItem[]> {
        return this.dmChannelRepo.listByUserId(userId)
    }
}
