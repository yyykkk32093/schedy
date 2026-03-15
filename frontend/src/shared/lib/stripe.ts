import { loadStripe } from '@stripe/stripe-js'

/**
 * Stripe.js をシングルトンで初期化。
 * 環境変数 VITE_STRIPE_PUBLISHABLE_KEY が必要。
 */
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

export const stripePromise = stripePublishableKey
    ? loadStripe(stripePublishableKey)
    : null

export function isStripeConfigured(): boolean {
    return !!stripePublishableKey
}
