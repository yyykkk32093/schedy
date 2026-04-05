import type { INotificationRepository } from '@/application/_sharedApplication/notification/INotificationRepository.js'
import type { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import type { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import type { IDMChannelRepository } from '@/domains/chat/domain/repository/IDMChannelRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'

export type CreateDMChannelTxRepositories = {
    dmChannel: IDMChannelRepository
    notification: INotificationRepository
    outbox: IOutboxRepository
}

export interface CreateDMChannelInput {
    /** リクエスト発行者のユーザー ID */
    userId: string
    /** DM 相手の userId 群（自分は含まなくてよい） */
    participantIds: string[]
}

export interface CreateDMChannelResult {
    channelId: string
    participants: string[]
    /** true = 既存を返した（新規作成せず） */
    alreadyExisted: boolean
}

/**
 * DM チャンネル作成 UseCase
 *
 * - 同一参加者セットの DM が既にあれば冪等に返す（2人DM）
 * - 新規作成時は相手に通知を送信
 */
export class CreateDMChannelUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<CreateDMChannelTxRepositories>,
        private readonly notificationService: NotificationService,
    ) { }

    async execute(input: CreateDMChannelInput): Promise<CreateDMChannelResult> {
        const allParticipants = Array.from(new Set([input.userId, ...input.participantIds]))

        if (allParticipants.length < 2) {
            throw new Error('DM には 2 人以上の参加者が必要です')
        }

        // 1. 2人DMの場合、既存チャンネルを確認
        if (allParticipants.length === 2) {
            // TX外で既存確認（読み取りのみ）
            const result = await this.unitOfWork.run(async (repos) => {
                const existing = await repos.dmChannel.findByParticipants(allParticipants)
                if (existing) {
                    return { ...existing, alreadyExisted: true as const }
                }
                return null
            })
            if (result) return result
        }

        // 2. 新規作成 + 通知をアトミックに実行
        const created = await this.unitOfWork.run(async (repos) => {
            const channel = await repos.dmChannel.create(allParticipants)

            // 相手に通知
            for (const pid of allParticipants) {
                if (pid === input.userId) continue
                await this.notificationService.prepareNotification(repos, {
                    userId: pid,
                    type: 'DM',
                    title: '新しいDM',
                    body: 'DMが開始されました',
                    referenceId: channel.channelId,
                    referenceType: 'DM_CHANNEL',
                    metadata: { channelId: channel.channelId },
                })
            }

            return channel
        })

        // TX 成功後に WebSocket emit
        this.notificationService.flush()

        return { ...created, alreadyExisted: false }
    }
}
