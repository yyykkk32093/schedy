import type { IPaymentStrategy } from './IPaymentStrategy.js'

/** PayPay 払い: 参加者が支払報告 → 管理者が確認 */
export class PayPayStrategy implements IPaymentStrategy {
    readonly method = 'PAYPAY' as const
    canReportPayment(): boolean { return true }
    requiresAdminConfirmation(): boolean { return true }
}
