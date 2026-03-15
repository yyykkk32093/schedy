import { logger } from '@/_sharedTech/logger/logger.js'
import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'
import type Stripe from 'stripe'

export const stripeWebhookController = {
    async handleWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            const { StripeServiceImpl } = await import('@/integration/stripe/StripeServiceImpl.js')
            const stripeService = new StripeServiceImpl()

            const signature = req.headers['stripe-signature'] as string
            if (!signature) {
                res.status(400).json({ error: 'Missing stripe-signature header' })
                return
            }

            // Webhook 署名検証（raw body 必須）
            let event: Stripe.Event
            try {
                event = stripeService.verifyWebhookSignature(req.body, signature)
            } catch (err) {
                logger.warn({ error: err }, '[StripeWebhook] Signature verification failed')
                res.status(400).json({ error: 'Invalid signature' })
                return
            }

            // イベントタイプごとにディスパッチ
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object as Stripe.PaymentIntent
                    const useCase = usecaseFactory.createHandleStripePaymentSucceededUseCase()
                    await useCase.execute({
                        paymentIntentId: paymentIntent.id,
                        metadata: paymentIntent.metadata as Record<string, string>,
                    })
                    break
                }

                case 'charge.refunded': {
                    const charge = event.data.object as Stripe.Charge
                    const useCase = usecaseFactory.createHandleStripeRefundCompletedUseCase()
                    await useCase.execute({
                        paymentIntentId: (charge.payment_intent as string) ?? '',
                        metadata: charge.metadata as Record<string, string>,
                    })
                    break
                }

                default:
                    logger.debug({ eventType: event.type }, '[StripeWebhook] Unhandled event type')
            }

            res.status(200).json({ received: true })
        } catch (err) {
            next(err)
        }
    },
}
