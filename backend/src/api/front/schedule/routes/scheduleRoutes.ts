import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { scheduleController } from '../controllers/scheduleController.js'

const router = Router()

// Activity 配下の Schedule 作成/一覧
router.post('/v1/activities/:activityId/schedules', authMiddleware, scheduleController.create)
router.get('/v1/activities/:activityId/schedules', authMiddleware, scheduleController.list)

// Schedule 単体操作
router.get('/v1/schedules/:id', authMiddleware, scheduleController.findById)
router.patch('/v1/schedules/:id', authMiddleware, scheduleController.update)
router.patch('/v1/schedules/:id/cancel', authMiddleware, scheduleController.cancel)

export default router
