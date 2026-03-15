/**
 * Stripe Connect / Payment のポートインターフェース
 *
 * アプリケーション層から呼ばれ、Stripe SDK への依存を隔離する。
 */

export interface CreateConnectAccountResult {
    stripeAccountId: string
}

export interface CreateAccountLinkResult {
    url: string
}

export interface CreateLoginLinkResult {
    url: string
}

export interface ConnectAccountStatus {
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
}

export interface CreatePaymentIntentResult {
    clientSecret: string
    paymentIntentId: string
}

export interface IStripeService {
    /**
     * Stripe Connect Express アカウントを作成
     */
    createConnectAccount(): Promise<CreateConnectAccountResult>

    /**
     * オンボーディング用の Account Link を生成
     */
    createAccountLink(params: {
        stripeAccountId: string
        refreshUrl: string
        returnUrl: string
    }): Promise<CreateAccountLinkResult>

    /**
     * ダッシュボードログインリンクを生成
     */
    createLoginLink(stripeAccountId: string): Promise<CreateLoginLinkResult>

    /**
     * Connect アカウントのステータスを取得
     */
    getAccountStatus(stripeAccountId: string): Promise<ConnectAccountStatus>

    /**
     * Destination Charges で PaymentIntent を作成
     *
     * transfer_data.amount でコミュニティ入金額を直接指定。
     * 残りはプラットフォーム（アプリ）受取。
     */
    createPaymentIntent(params: {
        amount: number
        currency: string
        destinationAccountId: string
        transferAmount: number
        metadata?: Record<string, string>
    }): Promise<CreatePaymentIntentResult>

    /**
     * 返金（全額または部分）
     * @param amount 返金額（指定なしで全額返金）
     */
    refundPaymentIntent(paymentIntentId: string, amount?: number): Promise<void>

    /**
     * Webhook 署名検証
     */
    verifyWebhookSignature(payload: string | Buffer, signature: string): ReturnType<typeof import('stripe').default.prototype.webhooks.constructEvent>
}
