/**
 * Auth — Zod バリデーションスキーマ
 */
import { z } from 'zod/v4'

/**
 * POST /v1/auth/sessions
 *
 * Phase 3 (REST 再設計): パスワード / OAuth ログインを単一エンドポイントに統合。
 * `method` で認証方式を判別する discriminated union。
 */
export const createSessionSchema = z.discriminatedUnion('method', [
    z.object({
        method: z.literal('password'),
        email: z.string().email('有効なメールアドレスを入力してください'),
        password: z.string().min(1, 'パスワードは必須です'),
    }),
    z.object({
        method: z.literal('oauth'),
        provider: z.enum(['google', 'line', 'apple']),
        code: z.string().min(1, '認可コードは必須です'),
        redirectUri: z.string().optional(),
    }),
])

export type CreateSessionInput = z.infer<typeof createSessionSchema>
