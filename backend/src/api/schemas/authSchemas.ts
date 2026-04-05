/**
 * Auth — Zod バリデーションスキーマ
 */
import { z } from 'zod/v4'

/** POST /v1/auth/password */
export const passwordLoginSchema = z.object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(1, 'パスワードは必須です'),
})

/** POST /v1/auth/oauth/:provider */
export const oauthLoginSchema = z.object({
    code: z.string().min(1, '認可コードは必須です'),
    redirectUri: z.string().optional(),
})
