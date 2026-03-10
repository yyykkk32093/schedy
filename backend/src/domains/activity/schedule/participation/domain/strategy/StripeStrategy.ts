import type { IPaymentStrategy } from './IPaymentStrategy.js'

/**
 * Stripe 払い: Phase 5 で完全実装予定。
 * 現時点ではフラグのみ返す。
 */
export class StripeStrategy implements IPaymentStrategy {
    readonly method = 'STRIPE' as const
    canReportPayment(): boolean { return false }
    requiresAdminConfirmation(): boolean { return false }
}
