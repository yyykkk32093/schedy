import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { communityController } from '../controllers/communityController.js'

const router = Router()

// Phase 2.5: 検索・公開詳細（search は /v1/communities/:id より先に定義）
router.get('/v1/communities/search', authMiddleware, communityController.search)
router.get('/v1/communities/public/:id', authMiddleware, communityController.findPublicById)

router.post('/v1/communities', authMiddleware, communityController.create)
router.post('/v1/communities/:parentId/children', authMiddleware, communityController.createChild)
router.get('/v1/communities', authMiddleware, communityController.list)
router.get('/v1/communities/:id', authMiddleware, communityController.findById)
router.patch('/v1/communities/:id', authMiddleware, communityController.update)
router.delete('/v1/communities/:id', authMiddleware, communityController.softDelete)

// Phase 2.5: 参加・参加リクエスト
router.post('/v1/communities/:id/join', authMiddleware, communityController.join)
router.post('/v1/communities/:id/join-request', authMiddleware, communityController.requestJoin)

// UBL-10: 監査ログ
router.get('/v1/communities/:id/audit-logs', authMiddleware, communityController.listAuditLogs)

export default router
