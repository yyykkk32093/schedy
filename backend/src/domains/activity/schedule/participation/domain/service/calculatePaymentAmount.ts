/**
 * Stripe 手数料計算ユーティリティ
 *
 * 4% 上乗せ方式:
 * - ユーザー支払い = baseFee + ceil(baseFee × 0.04)
 * - transfer_data.amount = baseFee（コミュニティに参加費ぴったり入金）
 * - 返金 = baseFee のみ（手数料は返金対象外）
 */

/** 手数料率（4%: Stripe 3.6% + アプリ 0.4%） */
export const PLATFORM_FEE_RATE = 0.04

export interface PaymentAmountBreakdown {
    /** 参加費（コミュニティ設定値 = コミュニティ入金額） */
    baseFee: number
    /** 手数料（ユーザー表示用） */
    platformFee: number
    /** ユーザー支払い額（= baseFee + platformFee） */
    totalAmount: number
    /** Stripe transfer_data.amount（= baseFee） */
    transferAmount: number
    /** キャンセル時返金額（= baseFee のみ。手数料は返金対象外） */
    refundAmount: number
}

/**
 * 参加費から Stripe 決済に必要な各金額を計算する
 *
 * @param baseFee - 参加費（コミュニティが設定した金額。正の整数）
 * @throws baseFee が 0 以下の場合
 *
 * @example
 * ```ts
 * calculatePaymentAmount(1000)
 * // => { baseFee: 1000, platformFee: 40, totalAmount: 1040, transferAmount: 1000, refundAmount: 1000 }
 * ```
 */
export function calculatePaymentAmount(baseFee: number): PaymentAmountBreakdown {
    if (!Number.isInteger(baseFee) || baseFee <= 0) {
        throw new Error(`baseFee は正の整数である必要があります: ${baseFee}`)
    }

    const platformFee = Math.ceil(baseFee * PLATFORM_FEE_RATE)
    const totalAmount = baseFee + platformFee

    return {
        baseFee,
        platformFee,
        totalAmount,
        transferAmount: baseFee,
        refundAmount: baseFee,
    }
}
