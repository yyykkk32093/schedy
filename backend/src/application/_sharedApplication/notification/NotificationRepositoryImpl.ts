/**
 * NotificationRepositoryImpl
 *
 * Prisma を使った INotificationRepository の実装。
 * tx-scope で注入される（PrismaUnitOfWork 経由）。
 */
import type {
    INotificationReadRepository,
    INotificationRepository,
    NotificationCreateInput,
    NotificationListItem,
    NotificationQueryOptions,
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
                metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
                isRead: false,
            },
        })
    }
}

function toListItem(n: {
    id: string
    userId: string
    type: string
    title: string
    body: string | null
    referenceId: string | null
    referenceType: string | null
    metadata: unknown
    isRead: boolean
    createdAt: Date
}): NotificationListItem {
    return {
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        referenceId: n.referenceId,
        referenceType: n.referenceType,
        metadata: n.metadata ?? null,
        isRead: n.isRead,
        createdAt: n.createdAt,
    }
}

export class NotificationReadRepositoryImpl implements INotificationReadRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient,
    ) { }

    async findMany(options: NotificationQueryOptions): Promise<NotificationListItem[]> {
        const where = options.typeFilter
            ? { userId: options.userId, type: { in: options.typeFilter } }
            : { userId: options.userId }
        const rows = await this.db.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options.limit,
            ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
        })
        return rows.map(toListItem)
    }

    async countUnread(userId: string, typeFilter?: string[]): Promise<number> {
        const where = typeFilter
            ? { userId, isRead: false, type: { in: typeFilter } }
            : { userId, isRead: false }
        return this.db.notification.count({ where })
    }

    async findByIdForUser(notificationId: string, userId: string): Promise<NotificationListItem | null> {
        const row = await this.db.notification.findUnique({ where: { id: notificationId } })
        if (!row || row.userId !== userId) return null
        return toListItem(row)
    }

    async markAsRead(notificationId: string): Promise<NotificationListItem> {
        const row = await this.db.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        })
        return toListItem(row)
    }

    async markAllAsReadByUserId(userId: string): Promise<void> {
        await this.db.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        })
    }
}
