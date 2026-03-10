import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { announcementController } from '../controllers/announcementController.js'

const router = Router()

// ---- Feed（横断取得）は :id より前に定義 ----
router.get('/v1/announcements/feed', authMiddleware, announcementController.feed)

// UBL-4: 検索
router.get('/v1/announcements/search', authMiddleware, announcementController.search)

router.post('/v1/communities/:communityId/announcements', authMiddleware, announcementController.create)
router.get('/v1/communities/:communityId/announcements', authMiddleware, announcementController.list)

router.get('/v1/announcements/:id', authMiddleware, announcementController.findById)
router.patch('/v1/announcements/:id/read', authMiddleware, announcementController.markAsRead)
router.patch('/v1/announcements/:id', authMiddleware, announcementController.update)
router.delete('/v1/announcements/:id', authMiddleware, announcementController.softDelete)

// UBL-1: いいね toggle
router.post('/v1/announcements/:id/like', authMiddleware, announcementController.toggleLike)

// Phase 3 (3-1): ブックマーク toggle
router.post('/v1/announcements/:id/bookmark', authMiddleware, announcementController.toggleBookmark)

// UBL-2: コメント CRUD
router.get('/v1/announcements/:id/comments', authMiddleware, announcementController.listComments)
router.post('/v1/announcements/:id/comments', authMiddleware, announcementController.createComment)
router.delete('/v1/announcements/comments/:commentId', authMiddleware, announcementController.deleteComment)

export default router
