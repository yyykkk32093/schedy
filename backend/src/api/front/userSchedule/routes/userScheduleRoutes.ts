import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { userScheduleController } from '../controllers/userScheduleController.js'

const router = Router()

// ユーザー横断スケジュール一覧（カレンダー / タイムライン用）
router.get('/v1/users/me/schedules', authMiddleware, userScheduleController.listMySchedules)

export default router
