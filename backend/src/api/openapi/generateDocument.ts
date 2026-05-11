/**
 * OpenAPIドキュメント生成
 *
 * 呼び出し側は generateOpenApiDocument() を import するだけでOK。
 * registry への登録は副作用 import (registerSchemas / registerPaths) で行われる。
 */

// 副作用として registry への登録を実行
import './registerSchemas.js'
import './registerPaths.js'

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './setup.js'

export function generateOpenApiDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions)
    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            title: 'tsunaca API',
            version: '1.0.0',
            description: 'tsunaca バックエンド REST API ドキュメント（自動生成）',
        },
        servers: [
            { url: 'http://localhost:3000', description: 'ローカル開発' },
        ],
    })
}
