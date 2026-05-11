/**
 * OpenAPI エンドポイント
 *
 * GET /openapi.json  → OpenAPI 3.0 JSON 仕様書
 * GET /api-docs      → Swagger UI
 *
 * 認証不要（開発環境専用ルート）。本番環境では env 変数で無効化できる。
 */
import { Router, type Request, type Response } from 'express'
import swaggerUi from 'swagger-ui-express'
import { generateOpenApiDocument } from '../generateDocument.js'

const router = Router()

// ドキュメントは起動後に一度だけ生成してキャッシュする
let cachedDocument: ReturnType<typeof generateOpenApiDocument> | null = null
function getDocument() {
    if (!cachedDocument) {
        cachedDocument = generateOpenApiDocument()
    }
    return cachedDocument
}

/** GET /openapi.json */
router.get('/openapi.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json')
    res.json(getDocument())
})

/** GET /api-docs (Swagger UI) */
router.use('/api-docs', swaggerUi.serve)
router.get('/api-docs', swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/openapi.json' },
}))

export default router
