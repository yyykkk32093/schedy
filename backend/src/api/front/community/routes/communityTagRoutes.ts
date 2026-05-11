/**
 * Community Tag API Routes
 *
 * コミュニティのタグを管理する CRUD エンドポイント。
 * OWNER/ADMIN 以上のみ変更可能。
 */
import { usecaseFactory } from '@/api/_usecaseFactory.js'
import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import { saveTagsSchema } from '@/api/schemas/index.js'
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'

const router = Router()

/**
 * GET /v1/communities/:communityId/tags
 */
router.get(
    '/v1/communities/:communityId/tags',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { communityId } = req.params
            const result = await usecaseFactory.createListCommunityTagsUseCase().execute({ communityId })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },
)

/**
 * PUT /v1/communities/:communityId/tags
 * Body: { tags: string[] }
 */
router.put(
    '/v1/communities/:communityId/tags',
    authMiddleware,
    validateBody(saveTagsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId
            const { communityId } = req.params
            const { tags } = req.body as { tags: string[] }

            if (!Array.isArray(tags)) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'tags 配列が必要です' })
                return
            }

            const result = await usecaseFactory.createReplaceCommunityTagsUseCase().execute({
                communityId,
                userId,
                tags,
            })

            res.json(result)
        } catch (err) {
            next(err)
        }
    },
)

export default router
