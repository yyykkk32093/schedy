import { usecaseFactory } from '@/api/_usecaseFactory.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import { requireFeature, requireLimit } from '@/api/middleware/featureGateMiddleware.js';
import { validateBody } from '@/api/middleware/validateBody.js';
import { addReactionSchema, createStampSchema } from '@/api/schemas/index.js';
import { UserFeature, UserLimitKey } from '@/domains/_sharedDomains/featureGate/UserFeature.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

/**
 * POST /v1/stamps
 * スタンプ作成（PRO/LIFETIME のみ, 上限100）
 */
router.post(
    '/v1/stamps',
    authMiddleware,
    requireFeature(UserFeature.CUSTOM_STAMP),
    requireLimit(UserLimitKey.MAX_CUSTOM_STAMPS, async (req) => {
        return usecaseFactory.createStampRepository().countByUser(req.user!.userId);
    }),
    validateBody(createStampSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;

            const { name, imageUrl } = req.body as {
                name: string;
                imageUrl: string;
            };

            if (!name || !imageUrl) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'name と imageUrl は必須です' });
                return;
            }

            const stamp = await usecaseFactory.createStampRepository().create({
                createdByUserId: userId,
                name,
                imageUrl,
            });

            res.status(201).json(stamp);
        } catch (err) {
            next(err);
        }
    });

/**
 * GET /v1/stamps
 * スタンプ一覧（自分が作成したもの）
 */
router.get('/v1/stamps', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        const stamps = await usecaseFactory.createStampRepository().listByUser(userId);

        res.json({ stamps });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /v1/stamps/:stampId
 * スタンプ削除
 */
router.delete('/v1/stamps/:stampId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { stampId } = req.params;

        const stampRepo = usecaseFactory.createStampRepository();
        const stamp = await stampRepo.findById(stampId);
        if (!stamp) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'スタンプが見つかりません' });
            return;
        }
        if (stamp.createdByUserId !== userId) {
            res.status(403).json({ code: 'FORBIDDEN', message: '自分のスタンプのみ削除できます' });
            return;
        }

        // リアクション・関連もカスケード削除
        await stampRepo.deleteWithReactions(stampId);

        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

/**
 * POST /v1/messages/:messageId/reactions
 * メッセージへのリアクション追加（REST版）
 * stampId または emoji のいずれかを指定（排他）
 */
router.post('/v1/messages/:messageId/reactions', authMiddleware, validateBody(addReactionSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { messageId } = req.params;
        const { stampId, emoji } = req.body as { stampId?: string; emoji?: string };

        if (!stampId && !emoji) {
            res.status(400).json({ code: 'INVALID_REQUEST', message: 'stampId または emoji のいずれかは必須です' });
            return;
        }
        if (stampId && emoji) {
            res.status(400).json({ code: 'INVALID_REQUEST', message: 'stampId と emoji は同時に指定できません' });
            return;
        }

        const result = await usecaseFactory.createAddReactionUseCase().execute({
            messageId,
            userId,
            stampId,
            emoji,
        });

        // WebSocket 通知
        const io = req.app.get('io');
        if (io) {
            io.to(`channel:${result.channelId}`).emit('reaction:updated', {
                messageId,
            });
        }

        res.status(201).json({ messageId, userId, stampId: stampId ?? null, emoji: emoji ?? null });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /v1/messages/:messageId/reactions/:identifier
 * メッセージからのリアクション削除（REST版）
 * identifier は stampId（UUID形式）または emoji（絵文字文字列）
 */
router.delete('/v1/messages/:messageId/reactions/:identifier', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { messageId, identifier } = req.params;

        // UUID形式ならstampId、それ以外ならemoji
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        try {
            const result = await usecaseFactory.createRemoveReactionUseCase().execute({
                messageId,
                userId,
                stampId: isUuid ? identifier : undefined,
                emoji: isUuid ? undefined : decodeURIComponent(identifier),
            });

            // WebSocket 通知
            const io = req.app.get('io');
            if (io) {
                io.to(`channel:${result.channelId}`).emit('reaction:updated', {
                    messageId,
                });
            }
        } catch (e: unknown) {
            // メッセージが見つからないと NOT_FOUND を投げるが、旧挙動（連携チャンネルへの emit スキップしつつ 204）に合わせて無視
            const err = e as { code?: string };
            if (err.code !== 'NOT_FOUND') throw e;
        }

        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

export default router;
