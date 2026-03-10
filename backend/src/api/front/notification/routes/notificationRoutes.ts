import { prisma } from '@/_sharedTech/db/client.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

/**
 * GET /v1/notifications
 * 自分の通知一覧（ページネーション付き）
 *
 * クエリパラメータ:
 *  - category: 'community' | 'activity' | 'chat' （省略で全件）
 *  - cursor: ページネーションカーソル
 *  - limit: 取得件数（最大100、デフォルト30）
 */
// 通知タイプのカテゴリマッピング
const CATEGORY_TYPE_MAP: Record<string, string[]> = {
    community: ['ANNOUNCEMENT', 'INVITE_ACCEPTED', 'JOIN_REQUEST', 'JOIN_APPROVED', 'MEMBER_REMOVED'],
    activity: ['SCHEDULE_CANCELLED', 'WAITLIST_PROMOTED', 'PARTICIPATION_CONFIRMED', 'SCHEDULE_REMINDER', 'PAYMENT_REMINDER'],
    chat: ['MENTION', 'DM', 'REPLY'],
};

router.get('/v1/notifications', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(Number(req.query.limit) || 30, 100);
        const category = req.query.category as string | undefined;

        // カテゴリフィルタ
        const typeFilter = category && CATEGORY_TYPE_MAP[category]
            ? { type: { in: CATEGORY_TYPE_MAP[category] } }
            : {};

        const notifications = await prisma.notification.findMany({
            where: { userId, ...typeFilter },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
 * 未読通知数（category パラメータ対応）
 */
router.get('/v1/notifications/unread-count', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const category = req.query.category as string | undefined;

        const typeFilter = category && CATEGORY_TYPE_MAP[category]
            ? { type: { in: CATEGORY_TYPE_MAP[category] } }
            : {};

        const count = await prisma.notification.count({
            where: { userId, isRead: false, ...typeFilter },
        });
        res.json({ unreadCount: count });
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /v1/notifications/:notificationId/read
 * 通知を既読にする
 */
router.patch('/v1/notifications/:notificationId/read', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { notificationId } = req.params;

        const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notification || notification.userId !== userId) {
            res.status(404).json({ code: 'NOT_FOUND', message: '通知が見つかりません' });
            return;
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });

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
 * すべての通知を既読にする
 */
router.patch('/v1/notifications/read-all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
