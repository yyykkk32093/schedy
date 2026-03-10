import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { membershipController } from '../controllers/membershipController.js'

const router = Router()

router.post('/v1/communities/:id/members', authMiddleware, membershipController.addMember)
router.get('/v1/communities/:id/members', authMiddleware, membershipController.listMembers)
router.patch('/v1/communities/:id/members/:userId', authMiddleware, membershipController.changeRole)
router.delete('/v1/communities/:id/members/me', authMiddleware, membershipController.leave)
router.delete('/v1/communities/:id/members/:userId', authMiddleware, membershipController.removeMember)

export default router
