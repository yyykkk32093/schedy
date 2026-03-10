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
     * application_fee_amount = ceil(amount × 0.036)
     */
    createPaymentIntent(params: {
        amount: number
        currency: string
        destinationAccountId: string
        metadata?: Record<string, string>
    }): Promise<CreatePaymentIntentResult>

    /**
     * 全額返金
     */
    refundPaymentIntent(paymentIntentId: string): Promise<void>

    /**
     * Webhook 署名検証
     */
    verifyWebhookSignature(payload: string | Buffer, signature: string): ReturnType<typeof import('stripe').default.prototype.webhooks.constructEvent>
}
