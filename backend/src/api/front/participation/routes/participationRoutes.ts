import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { participationController } from '../controllers/participationController.js'

const router = Router()

// 参加者一覧
router.get('/v1/schedules/:id/participations', authMiddleware, participationController.list)

// 参加表明 / キャンセル
router.post('/v1/schedules/:id/participations', authMiddleware, participationController.attend)
router.delete('/v1/schedules/:id/participations/me', authMiddleware, participationController.cancel)

// 4-4: 参加履歴（直近キャンセル情報）
router.get('/v1/schedules/:id/participations/me/history', authMiddleware, participationController.getMyHistory)

// キャンセル待ち一覧 / 登録 / 辞退
router.get('/v1/schedules/:id/waitlist-entries', authMiddleware, participationController.listWaitlist)
router.post('/v1/schedules/:id/waitlist-entries', authMiddleware, participationController.joinWaitlist)
router.delete('/v1/schedules/:id/waitlist-entries/me', authMiddleware, participationController.cancelWaitlist)

// UBL-8: 支払報告 / 確認
router.patch('/v1/participations/:participationId/report-payment', authMiddleware, participationController.reportPayment)
router.patch('/v1/participations/:participationId/confirm-payment', authMiddleware, participationController.confirmPayment)

// 4-2: Stripe PaymentIntent 作成
router.post('/v1/schedules/:id/participations/me/stripe-payment-intent', authMiddleware, participationController.createStripePaymentIntent)

// 管理者による参加者除外
router.delete('/v1/schedules/:id/participations/:userId', authMiddleware, participationController.removeParticipant)

// 返金管理
router.get('/v1/schedules/:id/payments/refund-pending', authMiddleware, participationController.listRefundPendingBySchedule)
router.get('/v1/communities/:id/payments/refund-pending', authMiddleware, participationController.listRefundPendingByCommunity)
router.get('/v1/communities/:id/payments/resolved', authMiddleware, participationController.listPaymentHistory)
router.patch('/v1/payments/:paymentId/mark-refunded', authMiddleware, participationController.markRefundCompleted)
router.patch('/v1/payments/:paymentId/mark-no-refund', authMiddleware, participationController.markNoRefund)
router.patch('/v1/payments/:paymentId/revert-refund', authMiddleware, participationController.revertRefundStatus)

export default router
