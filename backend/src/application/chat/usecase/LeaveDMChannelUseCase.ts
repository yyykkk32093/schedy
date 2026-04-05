import type { IDMChannelRepository } from '@/domains/chat/domain/repository/IDMChannelRepository.js';

/**
 * DM チャンネル退出 UseCase
 *
 * DMParticipant を物理削除して退出する。
 */
export class LeaveDMChannelUseCase {
    constructor(private readonly dmChannelRepo: IDMChannelRepository) { }

    async execute(input: { userId: string; channelId: string }): Promise<void> {
        await this.dmChannelRepo.removeParticipant(input.channelId, input.userId)
    }
}
