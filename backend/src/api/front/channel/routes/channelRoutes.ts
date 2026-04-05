import { usecaseFactory } from '@/api/_usecaseFactory.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

/**
 * GET /v1/channels
 * 認証ユーザーが参加する全チャンネルを
 * { community, activity, dm } のグルーピングで返す。
 */
router.get('/v1/channels', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const useCase = usecaseFactory.createListMyChannelsUseCase();
        const result = await useCase.execute(userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
