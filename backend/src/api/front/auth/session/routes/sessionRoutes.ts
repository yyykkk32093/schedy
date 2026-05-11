import { featureGateService } from '@/_sharedTech/featureGate/featureGateServiceInstance.js'
import { usecaseFactory } from '@/api/_usecaseFactory.js'
import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { clearAuthCookie } from '@/api/middleware/cookieUtils.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import { createSessionSchema } from '@/api/schemas/index.js'
import { Router } from 'express'
import { sessionController } from '../controllers/sessionController.js'

const router = Router()

/**
 * セッション作成 (= ログイン) API
 * POST /v1/auth/sessions
 *
 * Phase 3 (REST 再設計): パスワード / OAuth 認証を単一エンドポイントに統合。
 * body 例:
 *   { "method": "password", "email": "...", "password": "..." }
 *   { "method": "oauth", "provider": "google", "code": "...", "redirectUri": "..." }
 */
router.post('/v1/auth/sessions', validateBody(createSessionSchema), sessionController.create)

/**
 * ログアウト API
 * POST /v1/auth/logout
 *
 * httpOnly Cookie をクリアしてログアウトする。
 */
router.post('/v1/auth/logout', (_req, res) => {
    clearAuthCookie(res)
    res.status(200).json({ message: 'logged out' })
})

/**
 * 認証確認 API
 * GET /v1/auth/me
 *
 * 現在のログイン状態を確認する。
 * httpOnly Cookie または Authorization Bearer ヘッダーからJWTを検証し、
 * ユーザー情報 + プラン + 機能制限 を返す。
 */
router.get('/v1/auth/me', authMiddleware, async (req, res) => {
    const userId = req.user!.userId

    const user = await usecaseFactory.createUserRepository().findAuthMeView(userId)

    if (!user) {
        res.status(404).json({ code: 'USER_NOT_FOUND', message: 'ユーザーが見つかりません' })
        return
    }

    const [features, limits] = await Promise.all([
        featureGateService.getUserFeatures(user.plan),
        featureGateService.getUserLimits(user.plan),
    ])

    res.status(200).json({
        userId: user.id,
        plan: user.plan,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        systemRole: user.systemRole,
        features,
        limits,
    })
})

export default router
