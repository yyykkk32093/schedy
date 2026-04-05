import { validateBody } from '@/api/middleware/validateBody.js'
import { oauthLoginSchema } from '@/api/schemas/index.js'
import { Router } from 'express'

import { oauthAuthController } from '../controllers/oauthAuthController.js'

const router = Router()

/**
 * OAuth認証 API
 * POST /v1/auth/oauth/:provider
 */
router.post('/v1/auth/oauth/:provider', validateBody(oauthLoginSchema), oauthAuthController.login)

export default router
