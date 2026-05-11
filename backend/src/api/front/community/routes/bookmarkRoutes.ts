import { usecaseFactory } from '@/api/_usecaseFactory.js'
import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'

const router = Router()

/**
 * Phase 3 (REST 再設計): ブックマークをリソース化。
 * 旧: POST /v1/communities/:id/bookmark / DELETE /v1/communities/:id/bookmark
 * 新: POST /v1/communities/:id/bookmarks / DELETE /v1/communities/:id/bookmarks
 */
router.post('/v1/communities/:id/bookmarks', authMiddleware, async (req, res, next) => {
    try {
        const { id: communityId } = req.params
        const userId = req.user!.userId

        await usecaseFactory.createAddCommunityBookmarkUseCase().execute({ communityId, userId })

        res.status(201).json({ bookmarked: true })
    } catch (err) {
        next(err)
    }
})

router.delete('/v1/communities/:id/bookmarks', authMiddleware, async (req, res, next) => {
    try {
        const { id: communityId } = req.params
        const userId = req.user!.userId

        await usecaseFactory.createRemoveCommunityBookmarkUseCase().execute({ communityId, userId })

        res.status(204).send()
    } catch (err) {
        next(err)
    }
})

/** GET /v1/bookmarks/communities — ブックマーク済みコミュニティ一覧 */
router.get('/v1/bookmarks/communities', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user!.userId

        const result = await usecaseFactory.createListBookmarkedCommunitiesUseCase().execute({ userId })

        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
})

export default router
