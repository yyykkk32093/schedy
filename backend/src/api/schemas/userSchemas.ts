/**
 * User — Zod バリデーションスキーマ
 */
import { z } from 'zod/v4'

/** POST /v1/users (SignUp) */
export const signUpSchema = z.object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z
        .string()
        .min(8, 'パスワードは8文字以上で入力してください')
        .max(100, 'パスワードは100文字以内で入力してください'),
    displayName: z.string().max(50).optional(),
})

/** PATCH /v1/users/me */
export const updateUserProfileSchema = z.object({
    displayName: z.string().max(50).nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    biography: z.string().max(500).nullable().optional(),
})

/** DELETE /v1/users/me */
export const deleteUserSchema = z.object({
    reason: z.string().min(1, '退会理由は必須です'),
    freeText: z.string().max(1000).optional(),
})
