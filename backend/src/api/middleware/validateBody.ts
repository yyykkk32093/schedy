import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod/v4'
import { ZodError } from 'zod/v4'

/**
 * Express ミドルウェア — req.body を Zod スキーマでバリデーション
 *
 * - 成功時: パース結果で req.body を上書き（型変換・デフォルト値を反映）
 * - 失敗時: 400 レスポンスを即時返却（フィールド別のエラー詳細付き）
 *
 * @example
 *   router.post('/v1/communities', auth, validateBody(createCommunitySchema), controller.create)
 */
export function validateBody<T>(schema: ZodType<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body)
            next()
        } catch (err) {
            if (err instanceof ZodError) {
                const fieldErrors = err.issues.map((issue) => {
                    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
                    return { path, message: issue.message }
                })

                // トップレベルの message にフィールド別サマリーを含める
                const summary = fieldErrors
                    .map((e) => `[${e.path}] ${e.message}`)
                    .join('; ')

                return res.status(400).json({
                    code: 'VALIDATION_ERROR',
                    message: `バリデーションエラー: ${summary}`,
                    errors: fieldErrors,
                })
            }
            next(err)
        }
    }
}
