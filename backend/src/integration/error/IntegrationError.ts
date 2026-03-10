/**
 * Integration層（Outbox/Dispatcher/Handler）のエラー基底クラス。
 *
 * retryable フラグにより、OutboxWorker が
 * 「リトライすべきか / 即 FAILED にすべきか」を判断する。
 */
export class IntegrationError extends Error {
    /** true ならリトライ対象、false なら即 FAILED + DLQ */
    readonly retryable: boolean
    /** エラー分類コード（DLQ の errorType カラムに保存） */
    readonly errorType: string

    constructor(params: {
        message: string
        retryable: boolean
        errorType: string
        cause?: unknown
    }) {
        super(params.message, { cause: params.cause })
        this.retryable = params.retryable
        this.errorType = params.errorType
        this.name = 'IntegrationError'
    }
}

/**
 * routingKey に対応する Handler が登録されていない。
 * リトライしても解決しないため retryable = false。
 */
export class HandlerNotFoundError extends IntegrationError {
    constructor(routingKey: string) {
        super({
            message: `No handler found for routingKey="${routingKey}"`,
            retryable: false,
            errorType: 'HANDLER_NOT_FOUND',
        })
        this.name = 'HandlerNotFoundError'
    }
}

/**
 * HTTP 通信でエラーレスポンスが返った。
 * - 4xx → retryable = false（リクエスト自体が不正）
 * - 5xx → retryable = true（サーバー側の一時障害）
 */
export class HttpIntegrationError extends IntegrationError {
    readonly statusCode: number
    readonly responseBody: string | null

    constructor(params: {
        statusCode: number
        responseBody?: string | null
        url: string
    }) {
        const retryable = params.statusCode >= 500
        super({
            message: `HTTP ${params.statusCode} from ${params.url}`,
            retryable,
            errorType: retryable ? 'HTTP_SERVER_ERROR' : 'HTTP_CLIENT_ERROR',
        })
        this.statusCode = params.statusCode
        this.responseBody = params.responseBody ?? null
        this.name = 'HttpIntegrationError'
    }
}

/**
 * ネットワークレベルの障害（タイムアウト、接続拒否など）。
 * 一時的な障害の可能性が高いため retryable = true。
 */
export class NetworkError extends IntegrationError {
    constructor(message: string, cause?: unknown) {
        super({
            message,
            retryable: true,
            errorType: 'NETWORK_ERROR',
            cause,
        })
        this.name = 'NetworkError'
    }
}

/**
 * Handler 内部で発生した予期しない例外。
 * 原因不明のためリトライを試みる。
 */
export class HandlerInternalError extends IntegrationError {
    constructor(message: string, cause?: unknown) {
        super({
            message,
            retryable: true,
            errorType: 'HANDLER_INTERNAL_ERROR',
            cause,
        })
        this.name = 'HandlerInternalError'
    }
}
