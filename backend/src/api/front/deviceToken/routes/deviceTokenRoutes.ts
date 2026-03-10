import { prisma } from '@/_sharedTech/db/client.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

/**
 * POST /v1/device-tokens
 * デバイストークン登録（FCM push notification 用）
 *
 * Body: { token: string, platform: 'ios' | 'android' | 'web' }
 */
router.post('/v1/device-tokens', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { token, platform } = req.body;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ code: 'INVALID_TOKEN', message: 'token は必須です' });
            return;
        }

        const validPlatforms = ['ios', 'android', 'web'];
        if (!platform || !validPlatforms.includes(platform)) {
            res.status(400).json({
                code: 'INVALID_PLATFORM',
                message: `platform は ${validPlatforms.join(', ')} のいずれかが必要です`,
            });
            return;
        }

        // upsert: 同じトークンが既に登録されている場合は userId を更新
        // （デバイスの持ち主が変わった場合を考慮）
        const deviceToken = await prisma.deviceToken.upsert({
            where: { token },
            create: { userId, token, platform },
            update: { userId, platform },
        });

        res.status(201).json({
            id: deviceToken.id,
            token: deviceToken.token,
            platform: deviceToken.platform,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /v1/device-tokens/:token
 * デバイストークン削除（ログアウト時等に呼び出す）
 */
router.delete('/v1/device-tokens/:token', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { token } = req.params;

        const existing = await prisma.deviceToken.findUnique({ where: { token } });
        if (!existing || existing.userId !== userId) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'デバイストークンが見つかりません' });
            return;
        }

        await prisma.deviceToken.delete({ where: { token } });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
