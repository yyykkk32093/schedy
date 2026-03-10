import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { webhookController } from '../controllers/webhookController.js'

const router = Router()

// ---- UBL-29: Webhook 設定 CRUD ----
router.put('/v1/communities/:communityId/webhooks', authMiddleware, webhookController.upsert)
router.get('/v1/communities/:communityId/webhooks', authMiddleware, webhookController.list)
router.delete('/v1/communities/:communityId/webhooks/:configId', authMiddleware, webhookController.remove)

export default router
