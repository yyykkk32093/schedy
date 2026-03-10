import type { IPaymentStrategy } from './IPaymentStrategy.js'

/** 現金払い: 参加者が支払報告 → 管理者が確認 */
export class CashStrategy implements IPaymentStrategy {
    readonly method = 'CASH' as const
    canReportPayment(): boolean { return true }
    requiresAdminConfirmation(): boolean { return true }
}
