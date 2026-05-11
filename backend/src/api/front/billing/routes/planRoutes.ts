import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { planController } from '../controllers/planController.js'

const router = Router()

// GET /v1/plans — 現在販売中のプラン一覧（認証不要 — 購入画面で公開表示）
router.get('/v1/plans', planController.listAvailablePlans)

// Phase 3 (REST 再設計): RPC 風 cancel をリソース指向の DELETE に変更
//   旧: POST /v1/billing/cancel
//   新: DELETE /v1/subscriptions/me （ログインユーザの現在サブスクリプションを解約）
router.delete('/v1/subscriptions/me', authMiddleware, planController.cancelSubscription)

export default router
