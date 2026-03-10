/**
 * NotificationRepositoryImpl
 *
 * Prisma を使った INotificationRepository の実装。
 * tx-scope で注入される（PrismaUnitOfWork 経由）。
 */
import type {
    INotificationRepository,
    NotificationCreateInput,
} from '@/application/_sharedApplication/notification/INotificationRepository.js'
import type { Prisma, PrismaClient } from '@prisma/client'

export class NotificationRepositoryImpl implements INotificationRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient,
    ) { }

    async create(input: NotificationCreateInput): Promise<void> {
        await this.db.notification.create({
            data: {
                id: input.id,
                userId: input.userId,
                type: input.type,
                title: input.title,
                body: input.body ?? null,
                referenceId: input.referenceId ?? null,
                referenceType: input.referenceType ?? null,
                isRead: false,
            },
        })
    }
}
