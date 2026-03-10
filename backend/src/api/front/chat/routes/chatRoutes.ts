import { prisma } from '@/_sharedTech/db/client.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

// ============================================================
// Channel CRUD
// ============================================================

/**
 * GET /v1/communities/:communityId/channel
 * コミュニティのチャットチャンネルを取得（なければ自動作成）
 */
router.get('/v1/communities/:communityId/channel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { communityId } = req.params;
        const userId = req.user!.userId;

        // メンバーシップ確認
        const membership = await prisma.communityMembership.findUnique({
            where: { communityId_userId: { communityId, userId } },
        });
        if (!membership || membership.leftAt) {
            res.status(403).json({ code: 'FORBIDDEN', message: 'コミュニティメンバーではありません' });
            return;
        }

        // チャンネル取得 or 作成
        let channel = await prisma.chatChannel.findUnique({ where: { communityId } });
        if (!channel) {
            channel = await prisma.chatChannel.create({
                data: { type: 'COMMUNITY', communityId },
            });
        }

        res.json({ channelId: channel.id, type: channel.type, communityId: channel.communityId });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /v1/activities/:activityId/channel
 * アクティビティのチャットチャンネルを取得（なければ自動作成）
 */
router.get('/v1/activities/:activityId/channel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activityId } = req.params;
        const userId = req.user!.userId;

        // アクティビティ存在 + メンバーシップ確認
        const activity = await prisma.activity.findUnique({ where: { id: activityId } });
        if (!activity || activity.deletedAt) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'アクティビティが見つかりません' });
            return;
        }
        const membership = await prisma.communityMembership.findUnique({
            where: { communityId_userId: { communityId: activity.communityId, userId } },
        });
        if (!membership || membership.leftAt) {
            res.status(403).json({ code: 'FORBIDDEN', message: 'コミュニティメンバーではありません' });
            return;
        }

        let channel = await prisma.chatChannel.findUnique({ where: { activityId } });
        if (!channel) {
            channel = await prisma.chatChannel.create({
                data: { type: 'ACTIVITY', activityId },
            });
        }

        res.json({ channelId: channel.id, type: channel.type, activityId: channel.activityId });
    } catch (err) {
        next(err);
    }
});

// ============================================================
// Messages
// ============================================================

/**
 * GET /v1/channels/:channelId/messages?cursor=&limit=
 * メッセージ一覧（ページネーション、新しい順）
 */
router.get('/v1/channels/:channelId/messages', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { channelId } = req.params;
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(Number(req.query.limit) || 50, 100);

        const messages = await prisma.message.findMany({
            where: {
                channelId,
                parentMessageId: null, // トップレベルのみ
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                attachments: true,
                reactions: { include: { stamp: true } },
                _count: { select: { replies: true } },
            },
        });

        const hasMore = messages.length > limit;
        const items = hasMore ? messages.slice(0, limit) : messages;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        res.json({
            messages: items.map((m) => ({
                id: m.id,
                channelId: m.channelId,
                senderId: m.senderId,
                parentMessageId: m.parentMessageId,
                content: m.content,
                mentions: m.mentions,
                isPinned: m.isPinned,
                attachments: m.attachments,
                reactions: m.reactions.map((r) => ({
                    id: r.id,
                    userId: r.userId,
                    stampId: r.stampId,
                    stamp: r.stamp,
                    createdAt: r.createdAt.toISOString(),
                })),
                replyCount: m._count.replies,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
            })),
            nextCursor,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /v1/channels/:channelId/messages/search?q=&cursor=&limit=
 * メッセージ検索（ILIKE 部分一致）
 *
 * クエリパラメータ:
 *  - q: 検索キーワード（必須、2文字以上）
 *  - cursor: ページネーションカーソル
 *  - limit: 取得件数（最大100、デフォルト30）
 */
router.get('/v1/channels/:channelId/messages/search', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { channelId } = req.params;
        const q = (req.query.q as string | undefined)?.trim();
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(Number(req.query.limit) || 30, 100);

        if (!q || q.length < 2) {
            res.status(400).json({ code: 'INVALID_QUERY', message: '検索キーワードは2文字以上必要です' });
            return;
        }

        // チャンネル存在確認
        const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
        if (!channel) {
            res.status(404).json({ code: 'CHANNEL_NOT_FOUND', message: 'チャンネルが見つかりません' });
            return;
        }

        const messages = await prisma.message.findMany({
            where: {
                channelId,
                content: { contains: q, mode: 'insensitive' },
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                attachments: true,
                reactions: { include: { stamp: true } },
                _count: { select: { replies: true } },
            },
        });

        const hasMore = messages.length > limit;
        const items = hasMore ? messages.slice(0, limit) : messages;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        res.json({
            messages: items.map((m) => ({
                id: m.id,
                channelId: m.channelId,
                senderId: m.senderId,
                parentMessageId: m.parentMessageId,
                content: m.content,
                mentions: m.mentions,
                isPinned: m.isPinned,
                attachments: m.attachments,
                reactions: m.reactions.map((r) => ({
                    id: r.id,
                    userId: r.userId,
                    stampId: r.stampId,
                    stamp: r.stamp,
                    createdAt: r.createdAt.toISOString(),
                })),
                replyCount: m._count.replies,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
            })),
            nextCursor,
            query: q,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /v1/messages/:messageId/replies?cursor=&limit=
 * スレッド返信一覧
 */
router.get('/v1/messages/:messageId/replies', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { messageId } = req.params;
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(Number(req.query.limit) || 50, 100);

        const replies = await prisma.message.findMany({
            where: { parentMessageId: messageId },
            orderBy: { createdAt: 'asc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                attachments: true,
                reactions: { include: { stamp: true } },
            },
        });

        const hasMore = replies.length > limit;
        const items = hasMore ? replies.slice(0, limit) : replies;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        res.json({
            messages: items.map((m) => ({
                id: m.id,
                channelId: m.channelId,
                senderId: m.senderId,
                parentMessageId: m.parentMessageId,
                content: m.content,
                mentions: m.mentions,
                isPinned: m.isPinned,
                attachments: m.attachments,
                reactions: m.reactions.map((r) => ({
                    id: r.id,
                    userId: r.userId,
                    stampId: r.stampId,
                    stamp: r.stamp,
                    createdAt: r.createdAt.toISOString(),
                })),
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
            })),
            nextCursor,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /v1/channels/:channelId/messages
 * REST でのメッセージ送信（WebSocket が使えない場合のフォールバック）
 */
router.post('/v1/channels/:channelId/messages', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { channelId } = req.params;
        const userId = req.user!.userId;
        const { content, parentMessageId, mentions } = req.body;

        if (!content?.trim()) {
            res.status(400).json({ code: 'INVALID_CONTENT', message: 'メッセージ内容が空です' });
            return;
        }

        const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
        if (!channel) {
            res.status(404).json({ code: 'CHANNEL_NOT_FOUND', message: 'チャンネルが見つかりません' });
            return;
        }

        const message = await prisma.message.create({
            data: {
                channelId,
                senderId: userId,
                content: content.trim(),
                parentMessageId: parentMessageId || null,
                mentions: mentions ?? [],
            },
            include: {
                attachments: true,
                reactions: { include: { stamp: true } },
            },
        });

        // WebSocket でもリアルタイム配信
        const io = req.app.get('io');
        if (io) {
            io.to(`channel:${channelId}`).emit('message:new', {
                id: message.id,
                channelId: message.channelId,
                senderId: message.senderId,
                parentMessageId: message.parentMessageId,
                content: message.content,
                mentions: message.mentions,
                isPinned: message.isPinned,
                attachments: message.attachments,
                reactions: [],
                createdAt: message.createdAt.toISOString(),
            });
        }

        res.status(201).json({ messageId: message.id });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /v1/messages/:messageId
 * メッセージ削除（送信者本人のみ）
 */
router.delete('/v1/messages/:messageId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { messageId } = req.params;
        const userId = req.user!.userId;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'メッセージが見つかりません' });
            return;
        }
        if (message.senderId !== userId) {
            res.status(403).json({ code: 'FORBIDDEN', message: '送信者本人のみ削除できます' });
            return;
        }

        await prisma.message.delete({ where: { id: messageId } });

        const io = req.app.get('io');
        if (io) {
            io.to(`channel:${message.channelId}`).emit('message:deleted', { messageId, channelId: message.channelId });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
