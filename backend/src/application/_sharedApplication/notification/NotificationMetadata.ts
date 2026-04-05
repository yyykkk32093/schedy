/**
 * NotificationMetadata — 通知種別ごとの構造化メタデータ型定義
 *
 * Discriminated Union: type フィールドで各通知固有のメタデータを型安全に管理。
 * Zod スキーマによるバリデーション付き。
 */
import { z } from 'zod/v4'

// ============================================================
// 個別メタデータスキーマ
// ============================================================

const mentionMetadataSchema = z.object({
    channelId: z.string(),
    channelName: z.string().optional(),
    senderName: z.string().optional(),
})

const dmMetadataSchema = z.object({
    channelId: z.string(),
    senderName: z.string().optional(),
})

const announcementMetadataSchema = z.object({
    communityId: z.string(),
    communityName: z.string().optional(),
    announcementId: z.string(),
})

const scheduleMetadataSchema = z.object({
    communityId: z.string().optional(),
    communityName: z.string().optional(),
    activityId: z.string(),
    activityTitle: z.string().optional(),
    scheduleDate: z.string().optional(),
})

const communityMetadataSchema = z.object({
    communityId: z.string(),
    communityName: z.string().optional(),
})

const pollMetadataSchema = z.object({
    communityId: z.string(),
    communityName: z.string().optional(),
    pollId: z.string(),
    pollTitle: z.string().optional(),
})

const paymentMetadataSchema = z.object({
    communityId: z.string(),
    activityId: z.string(),
    activityTitle: z.string().optional(),
    scheduleDate: z.string().optional(),
    amount: z.number().optional(),
})

// ============================================================
// 通知タイプ → メタデータスキーマのマッピング
// ============================================================

export const notificationMetadataSchemaMap = {
    MENTION: mentionMetadataSchema,
    DM: dmMetadataSchema,
    ANNOUNCEMENT: announcementMetadataSchema,
    WAITLIST_PROMOTED: scheduleMetadataSchema,
    SCHEDULE_CANCELLED: scheduleMetadataSchema,
    SCHEDULE_REMINDER: scheduleMetadataSchema,
    PARTICIPATION_CONFIRMED: scheduleMetadataSchema,
    PARTICIPATION_REMOVED_BY_ADMIN: scheduleMetadataSchema,
    ACTIVITY_CANCELLED: scheduleMetadataSchema,
    PAYMENT_REMINDER: paymentMetadataSchema,
    SAME_DAY_CANCELLATION: scheduleMetadataSchema,
    PAID_CANCELLATION: scheduleMetadataSchema,
    INVITE_ACCEPTED: communityMetadataSchema,
    JOIN_REQUEST: communityMetadataSchema,
    JOIN_APPROVED: communityMetadataSchema,
    MEMBER_REMOVED: communityMetadataSchema,
    POLL: pollMetadataSchema,
    REPLY: mentionMetadataSchema,
} as const

// ============================================================
// TypeScript 型
// ============================================================

export type NotificationType = keyof typeof notificationMetadataSchemaMap

export type MentionMetadata = z.infer<typeof mentionMetadataSchema>
export type DmMetadata = z.infer<typeof dmMetadataSchema>
export type AnnouncementMetadata = z.infer<typeof announcementMetadataSchema>
export type ScheduleMetadata = z.infer<typeof scheduleMetadataSchema>
export type CommunityMetadata = z.infer<typeof communityMetadataSchema>
export type PollMetadata = z.infer<typeof pollMetadataSchema>
export type PaymentMetadata = z.infer<typeof paymentMetadataSchema>

/** 全メタデータの Union 型 */
export type NotificationMetadata =
    | MentionMetadata
    | DmMetadata
    | AnnouncementMetadata
    | ScheduleMetadata
    | CommunityMetadata
    | PollMetadata
    | PaymentMetadata

/**
 * metadata のバリデーション
 * @param type 通知タイプ
 * @param metadata メタデータオブジェクト
 * @returns パース済みメタデータ（不正時は null）
 */
export function validateNotificationMetadata(
    type: string,
    metadata: unknown,
): NotificationMetadata | null {
    const schema = notificationMetadataSchemaMap[type as NotificationType]
    if (!schema) return null

    const result = schema.safeParse(metadata)
    if (result.success) return result.data as NotificationMetadata
    return null
}
