/**
 * zod-to-openapi セットアップ
 *
 * このモジュールを最初に import することで、Zod に .openapi() メソッドが付与される。
 * OpenAPIRegistry インスタンスはシングルトンとしてここで生成・export する。
 */
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod/v4'

// Zod のすべての型に .openapi() メソッドを追加 (一度だけ実行)
extendZodWithOpenApi(z)

export const registry = new OpenAPIRegistry()
