import { Router } from 'express'

import { oauthAuthController } from '../controllers/oauthAuthController.js'

const router = Router()

/**
 * OAuth認証 API
 * POST /v1/auth/oauth/:provider
 */
router.post('/v1/auth/oauth/:provider', oauthAuthController.login)

export default router
