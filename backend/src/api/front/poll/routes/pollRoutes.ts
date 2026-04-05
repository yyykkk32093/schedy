import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import { createPollSchema, votePollSchema } from '@/api/schemas/index.js'
import { Router } from 'express'
import { pollController } from '../controllers/pollController.js'

const router = Router()

// ---- UBL-34: 投票/アンケート ----
router.post('/v1/communities/:communityId/polls', authMiddleware, validateBody(createPollSchema), pollController.create)
router.get('/v1/communities/:communityId/polls', authMiddleware, pollController.list)
router.get('/v1/polls/:id', authMiddleware, pollController.getResult)
router.post('/v1/polls/:id/vote', authMiddleware, validateBody(votePollSchema), pollController.vote)
router.delete('/v1/polls/:id', authMiddleware, pollController.remove)

export default router
