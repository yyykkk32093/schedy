import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { inviteController } from '../controllers/inviteController.js'

const router = Router()

// 招待トークン生成
router.post('/v1/communities/:id/invite', authMiddleware, inviteController.generateToken)

// 招待トークン受諾
router.post('/v1/invites/:token/accept', authMiddleware, inviteController.acceptInvite)

export default router
