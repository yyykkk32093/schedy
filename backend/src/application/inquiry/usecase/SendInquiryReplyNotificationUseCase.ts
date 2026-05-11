import { NotificationService, type NotificationTxRepositories } from '@/application/_sharedApplication/notification/NotificationService.js'
import type { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'

export type SendInquiryReplyNotificationInput = {
    userId: string
    inquiryId: string
    inquiryTitle: string
}

/**
 * 運営から問い合わせ返信があった際に、ユーザーへ Notification と Push 用 OutboxEvent を作成する。
 *
 * Phase 2 [202603_08]: api/front/inquiry/service/inquiryNotificationService.ts の Prisma 直叩きを矯正。
 */
export class SendInquiryReplyNotificationUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<NotificationTxRepositories>,
        private readonly notificationService: NotificationService,
    ) { }

    async execute(input: SendInquiryReplyNotificationInput): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            await this.notificationService.prepareNotification(repos, {
                userId: input.userId,
                type: 'INQUIRY_REPLY',
                title: '運営から返信がありました',
                body: input.inquiryTitle,
                referenceId: input.inquiryId,
                referenceType: 'INQUIRY',
                metadata: { inquiryId: input.inquiryId },
            })
        })
        this.notificationService.flush()
    }
}
