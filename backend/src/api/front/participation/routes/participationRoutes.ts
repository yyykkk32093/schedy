import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { participationController } from '../controllers/participationController.js'

const router = Router()

// 参加者一覧
router.get('/v1/schedules/:id/participations', authMiddleware, participationController.list)

// 参加表明 / キャンセル
router.post('/v1/schedules/:id/participations', authMiddleware, participationController.attend)
router.delete('/v1/schedules/:id/participations/me', authMiddleware, participationController.cancel)

// キャンセル待ち登録 / 辞退
router.post('/v1/schedules/:id/waitlist-entries', authMiddleware, participationController.joinWaitlist)
router.delete('/v1/schedules/:id/waitlist-entries/me', authMiddleware, participationController.cancelWaitlist)

// UBL-8: 支払報告 / 確認
router.patch('/v1/participations/:participationId/report-payment', authMiddleware, participationController.reportPayment)
router.patch('/v1/participations/:participationId/confirm-payment', authMiddleware, participationController.confirmPayment)

export default router
