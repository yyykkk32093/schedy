/**
 * Misc — Upload / DeviceToken / Webhook / Expense / Notification
 */
import { z } from 'zod/v4'

// ── Upload ──

/** POST /v1/upload/url */
export const presignedUrlSchema = z.object({
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    fileSize: z.number().int().min(1).optional(),
})

/** POST /v1/upload/confirm */
export const uploadConfirmSchema = z.object({
    key: z.string().min(1),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
    fileSize: z.number().int().min(1).optional(),
})

/** POST /v1/channels/:channelId/messages/:messageId/attachments/presigned-url */
export const attachmentPresignedUrlSchema = z.object({
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
})

/** POST /v1/channels/:channelId/messages/:messageId/attachments/confirm */
export const attachmentConfirmSchema = z.object({
    key: z.string().min(1),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
    fileSize: z.number().int().min(1).optional(),
})

// ── DeviceToken ──

/** POST /v1/device-tokens */
export const registerDeviceTokenSchema = z.object({
    token: z.string().min(1, 'トークンは必須です'),
    platform: z.enum(['ios', 'android', 'web']),
})

// ── Expense ──

/** POST /v1/communities/:communityId/expenses */
export const createExpenseSchema = z.object({
    categoryId: z.string().uuid(),
    amount: z.number().int().min(1, '金額は1円以上で入力してください'),
    description: z.string().max(500).nullable().optional(),
    date: z.string().min(1, '日付は必須です'),
})

/** PATCH /v1/communities/:communityId/expenses/:expenseId */
export const updateExpenseSchema = z.object({
    categoryId: z.string().uuid().optional(),
    amount: z.number().int().min(1).optional(),
    description: z.string().max(500).nullable().optional(),
    date: z.string().optional(),
})

/** POST /v1/communities/:communityId/expense-categories */
export const createExpenseCategorySchema = z.object({
    name: z.string().min(1, 'カテゴリ名は必須です').max(50),
})

/** PATCH expense category (if exists) */
export const updateExpenseCategorySchema = z.object({
    name: z.string().min(1).max(50),
})

// ── Webhook (Stripe / RevenueCat) ──
// Note: Stripe webhook uses raw body verification, not JSON schema validation.
// RevenueCat webhook validation is also handled differently.
// These are intentionally excluded from validateBody middleware.
