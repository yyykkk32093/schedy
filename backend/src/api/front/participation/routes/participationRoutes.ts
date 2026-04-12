import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import {
    addGuestVisitorSchema,
    addRegisteredVisitorSchema,
    attendScheduleSchema,
    bulkConfirmPaymentsSchema,
    bulkUpdatePaymentsSchema,
    joinWaitlistSchema,
    updateVisitorPaymentSchema,
} from '@/api/schemas/index.js'
import { Router } from 'express'
import { participationController } from '../controllers/participationController.js'

const router = Router()

// 参加者一覧
router.get('/v1/schedules/:id/participations', authMiddleware, participationController.list)

// 参加表明 / キャンセル
router.post('/v1/schedules/:id/participations', authMiddleware, validateBody(attendScheduleSchema), participationController.attend)
router.delete('/v1/schedules/:id/participations/me', authMiddleware, participationController.cancel)

// 4-4: 参加履歴（直近キャンセル情報）
router.get('/v1/schedules/:id/participations/me/history', authMiddleware, participationController.getMyHistory)

// キャンセル待ち一覧 / 登録 / 辞退
router.get('/v1/schedules/:id/waitlist-entries', authMiddleware, participationController.listWaitlist)
router.post('/v1/schedules/:id/waitlist-entries', authMiddleware, validateBody(joinWaitlistSchema), participationController.joinWaitlist)
router.delete('/v1/schedules/:id/waitlist-entries/me', authMiddleware, participationController.cancelWaitlist)

// UBL-8: 支払報告 / 確認
router.patch('/v1/participations/:participationId/report-payment', authMiddleware, participationController.reportPayment)
router.patch('/v1/participations/:participationId/confirm-payment', authMiddleware, participationController.confirmPayment)

// #40: 現金支払い一括確認
router.patch('/v1/schedules/:id/payments/bulk-confirm', authMiddleware, validateBody(bulkConfirmPaymentsSchema), participationController.bulkConfirmPayment)

// D-P2-5: 一括支払い更新（All-or-Nothing）
router.patch('/v1/schedules/:id/payments/bulk', authMiddleware, validateBody(bulkUpdatePaymentsSchema), participationController.bulkUpdatePayment)

// 4-2: Stripe PaymentIntent 作成（繰り上げ参加者の支払い方法選択時に使用）
router.post('/v1/schedules/:id/participations/me/stripe-payment-intent', authMiddleware, participationController.createStripePaymentIntent)

// 管理者による参加者除外
router.delete('/v1/schedules/:id/participations/:userId', authMiddleware, participationController.removeParticipant)

// participationId ベースの参加者削除（ロールベース権限制御）
router.delete('/v1/participations/:participationId', authMiddleware, participationController.removeParticipation)

// 返金管理
router.get('/v1/schedules/:id/payments/refund-pending', authMiddleware, participationController.listRefundPendingBySchedule)
router.get('/v1/communities/:id/payments/refund-pending', authMiddleware, participationController.listRefundPendingByCommunity)
router.get('/v1/communities/:id/payments/resolved', authMiddleware, participationController.listPaymentHistory)
router.patch('/v1/payments/:paymentId/mark-refunded', authMiddleware, participationController.markRefundCompleted)
router.patch('/v1/payments/:paymentId/mark-no-refund', authMiddleware, participationController.markNoRefund)
router.patch('/v1/payments/:paymentId/revert-refund', authMiddleware, participationController.revertRefundStatus)

// ビジター管理
router.post('/v1/schedules/:id/guest-visitors', authMiddleware, validateBody(addGuestVisitorSchema), participationController.addGuestVisitor)
router.post('/v1/schedules/:id/registered-visitors', authMiddleware, validateBody(addRegisteredVisitorSchema), participationController.addRegisteredVisitor)
router.get('/v1/communities/:communityId/visitor-names', authMiddleware, participationController.suggestVisitorNames)
router.patch('/v1/participations/:participationId/visitor-payment', authMiddleware, validateBody(updateVisitorPaymentSchema), participationController.updateVisitorPayment)
router.patch('/v1/participations/:participationId/select-payment-method', authMiddleware, participationController.selectPaymentMethod)

export default router
