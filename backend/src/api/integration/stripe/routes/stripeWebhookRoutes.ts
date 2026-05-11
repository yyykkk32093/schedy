import express, { Router } from 'express'
import { stripeWebhookController } from '../controllers/stripeWebhookController.js'

const router = Router()

// Stripe Webhook は raw body が必要（署名検証に使用）
// Note: server.ts の express.json() より前にマウントするか、
//       ここで express.raw() を適用する
router.post(
    '/v1/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    stripeWebhookController.handleWebhook,
)

export default router
