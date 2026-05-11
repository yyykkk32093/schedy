import { NotificationService, type NotificationTxRepositories } from '@/application/_sharedApplication/notification/NotificationService.js'
import type { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'

export type SendMentionNotificationInput = {
    mentionedUserId: string
    senderDisplayName: string | null
    channelId: string
    messageId: string
    contentPreview: string
}

/**
 * チャットメンション時に、メンション対象ユーザーへ Notification と Push 用 OutboxEvent を作成する。
 *
 * Phase 2 [202603_08]: api/ws/socketHandlers.ts の Prisma 直叩きを矯正。
 */
export class SendMentionNotificationUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<NotificationTxRepositories>,
        private readonly notificationService: NotificationService,
    ) { }

    async execute(input: SendMentionNotificationInput): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            await this.notificationService.prepareNotification(repos, {
                userId: input.mentionedUserId,
                type: 'MENTION',
                title: 'メンションされました',
                body: input.contentPreview,
                referenceId: input.messageId,
                referenceType: 'MESSAGE',
                metadata: {
                    channelId: input.channelId,
                    senderName: input.senderDisplayName ?? undefined,
                },
            })
        })
        this.notificationService.flush()
    }
}
