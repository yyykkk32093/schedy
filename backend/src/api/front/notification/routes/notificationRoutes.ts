import { usecaseFactory } from '@/api/_usecaseFactory.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

// 通知タイプのカテゴリマッピング
const CATEGORY_TYPE_MAP: Record<string, string[]> = {
    community: ['ANNOUNCEMENT', 'INVITE_ACCEPTED', 'JOIN_REQUEST', 'JOIN_APPROVED', 'MEMBER_REMOVED'],
    activity: ['SCHEDULE_CANCELLED', 'WAITLIST_PROMOTED', 'PARTICIPATION_CONFIRMED', 'SCHEDULE_REMINDER', 'PAYMENT_REMINDER'],
    chat: ['MENTION', 'DM', 'REPLY'],
};

/**
 * GET /v1/notifications
 * 自分の通知一覧（ページネーション付き）
 */
router.get('/v1/notifications', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(Number(req.query.limit) || 30, 100);
        const category = req.query.category as string | undefined;
        const typeFilter = category && CATEGORY_TYPE_MAP[category] ? CATEGORY_TYPE_MAP[category] : undefined;

        const notifications = await usecaseFactory.createNotificationReadRepository().findMany({
            userId,
            typeFilter,
            cursor,
            limit: limit + 1,
        });

        const hasMore = notifications.length > limit;
        const result = hasMore ? notifications.slice(0, limit) : notifications;

        res.json({
            notifications: result.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                referenceId: n.referenceId,
                referenceType: n.referenceType,
                metadata: n.metadata ?? null,
                isRead: n.isRead,
                createdAt: n.createdAt.toISOString(),
            })),
            nextCursor: hasMore ? result[result.length - 1]?.id : null,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /v1/notifications/unread-count
 */
router.get('/v1/notifications/unread-count', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const category = req.query.category as string | undefined;
        const typeFilter = category && CATEGORY_TYPE_MAP[category] ? CATEGORY_TYPE_MAP[category] : undefined;

        const count = await usecaseFactory.createNotificationReadRepository().countUnread(userId, typeFilter);
        res.json({ unreadCount: count });
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /v1/notifications/:notificationId/read
 */
router.patch('/v1/notifications/:notificationId/read', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { notificationId } = req.params;

        const repo = usecaseFactory.createNotificationReadRepository();
        const notification = await repo.findByIdForUser(notificationId, userId);
        if (!notification) {
            res.status(404).json({ code: 'NOT_FOUND', message: '通知が見つかりません' });
            return;
        }

        const updated = await repo.markAsRead(notificationId);
        res.json({
            id: updated.id,
            isRead: updated.isRead,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /v1/notifications/read-all
 */
router.patch('/v1/notifications/read-all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        await usecaseFactory.createNotificationReadRepository().markAllAsReadByUserId(userId);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
