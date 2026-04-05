/**
 * Stripe Connect Onboarding ルート
 *
 * /v1/communities/:communityId/connect/...
 * 全エンドポイント authMiddleware 必須（OWNER 権限は UseCase 内で将来的にガード可能）
 */

import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { connectController } from '../controllers/connectController.js'

const router = Router()

// オンボーディング開始（Account Link URL 生成）
router.post(
    '/v1/communities/:communityId/connect/onboarding',
    authMiddleware,
    connectController.startOnboarding,
)

// Connect アカウントステータス取得
router.get(
    '/v1/communities/:communityId/connect/status',
    authMiddleware,
    connectController.getStatus,
)

// Express ダッシュボードリンク生成
router.post(
    '/v1/communities/:communityId/connect/dashboard-link',
    authMiddleware,
    connectController.createDashboardLink,
)

export default router
