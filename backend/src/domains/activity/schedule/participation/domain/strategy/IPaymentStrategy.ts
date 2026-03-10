import type { PaymentMethodType } from '../model/valueObject/PaymentMethod.js'

/**
 * 支払方法ごとの振る舞いを定義する Strategy インターフェース。
 * Phase 5 で Stripe 実装を追加予定。
 */
export interface IPaymentStrategy {
    readonly method: PaymentMethodType

    /**
     * 参加者が支払報告を行えるか
     */
    canReportPayment(): boolean

    /**
     * 管理者確認が必要か
     */
    requiresAdminConfirmation(): boolean
}
