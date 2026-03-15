/**
 * Stripe SDK を使った IStripeService 実装
 *
 * AppSecretsLoader.getStripe() から API キーを取得する。
 */

import { AppSecretsLoader } from '@/_sharedTech/config/AppSecretsLoader.js'
import Stripe from 'stripe'
import type {
    ConnectAccountStatus,
    CreateAccountLinkResult,
    CreateConnectAccountResult,
    CreateLoginLinkResult,
    CreatePaymentIntentResult,
    IStripeService,
} from './IStripeService.js'

export class StripeServiceImpl implements IStripeService {
    private _stripe: Stripe | null = null

    private get stripe(): Stripe {
        if (!this._stripe) {
            const config = AppSecretsLoader.getStripe()
            this._stripe = new Stripe(config.secretKey)
        }
        return this._stripe
    }

    async createConnectAccount(): Promise<CreateConnectAccountResult> {
        const account = await this.stripe.accounts.create({
            type: 'express',
            country: 'JP',
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        })

        return { stripeAccountId: account.id }
    }

    async createAccountLink(params: {
        stripeAccountId: string
        refreshUrl: string
        returnUrl: string
    }): Promise<CreateAccountLinkResult> {
        const link = await this.stripe.accountLinks.create({
            account: params.stripeAccountId,
            refresh_url: params.refreshUrl,
            return_url: params.returnUrl,
            type: 'account_onboarding',
        })

        return { url: link.url }
    }

    async createLoginLink(stripeAccountId: string): Promise<CreateLoginLinkResult> {
        const link = await this.stripe.accounts.createLoginLink(stripeAccountId)
        return { url: link.url }
    }

    async getAccountStatus(stripeAccountId: string): Promise<ConnectAccountStatus> {
        const account = await this.stripe.accounts.retrieve(stripeAccountId)
        return {
            chargesEnabled: account.charges_enabled ?? false,
            payoutsEnabled: account.payouts_enabled ?? false,
            detailsSubmitted: account.details_submitted ?? false,
        }
    }

    async createPaymentIntent(params: {
        amount: number
        currency: string
        destinationAccountId: string
        transferAmount: number
        metadata?: Record<string, string>
    }): Promise<CreatePaymentIntentResult> {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: params.amount,
            currency: params.currency,
            transfer_data: {
                destination: params.destinationAccountId,
                amount: params.transferAmount,
            },
            metadata: params.metadata,
        })

        return {
            clientSecret: paymentIntent.client_secret!,
            paymentIntentId: paymentIntent.id,
        }
    }

    async refundPaymentIntent(paymentIntentId: string, amount?: number): Promise<void> {
        await this.stripe.refunds.create({
            payment_intent: paymentIntentId,
            ...(amount !== undefined ? { amount } : {}),
        })
    }

    verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
        const config = AppSecretsLoader.getStripe()
        return this.stripe.webhooks.constructEvent(
            payload,
            signature,
            config.webhookSecret,
        )
    }
}
