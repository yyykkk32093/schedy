import { logger } from '@/_sharedTech/logger/logger.js'
import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'
import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import type { NextFunction, Request, Response } from 'express'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * グローバル例外ハンドラ
 *
 * - HttpError（とそのサブクラス: AuthenticationFailedError 等）→ 各 statusCode で返却
 * - DomainValidationError → 400
 * - それ以外 → 500（本番では詳細メッセージを隠蔽）
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({
            code: err.code,
            message: err.message,
        })
    }

    if (err instanceof DomainValidationError) {
        return res.status(400).json({
            code: err.code,
            message: err.message,
        })
    }

    logger.error({ error: err }, '[API] Unhandled error')
    return res.status(500).json({
        code: 'INTERNAL_SERVER_ERROR',
        message: isProduction
            ? 'サーバーで予期しないエラーが発生しました'
            : err instanceof Error
                ? err.message
                : 'Internal Server Error',
    })
}
