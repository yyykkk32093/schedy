import { logger } from '@/_sharedTech/logger/logger.js'
import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'
import { AuthenticationFailedError } from '@/application/auth/error/AuthenticationFailedError.js'
import type { NextFunction, Request, Response } from 'express'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AuthenticationFailedError) {
        return res.status(err.statusCode).json({
            code: err.reason,
            message: err.message,
        })
    }

    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({
            code: err.code,
            message: err.message,
        })
    }

    logger.error({ error: err }, '[API] Unhandled error')
    return res.status(500).json({
        code: 'INTERNAL_SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Internal Server Error',
    })
}
