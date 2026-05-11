/**
 * RevenueCat Webhook ルート
 *
 * POST /v1/webhooks/revenuecat
 */

import { Router } from 'express'
import { revenueCatWebhookController } from '../controllers/revenueCatWebhookController.js'

const router = Router()

router.post('/v1/webhooks/revenuecat', revenueCatWebhookController.handleWebhook)

export default router
