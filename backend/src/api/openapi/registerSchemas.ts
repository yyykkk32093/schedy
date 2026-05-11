/**
 * OpenAPI コンポーネントスキーマ登録
 *
 * - 入力スキーマ: OpenAPI ドキュメント専用にインライン定義（api/schemas/ とは別物）
 *   ※ extendZodWithOpenApi(z) が呼ばれた後に生成する必要があるため、
 *     api/schemas/ の Zod スキーマを直接再利用しない。
 * - 出力スキーマ: frontend/src/shared/types/api.ts の型と 1:1 で定義
 *
 * 登録した const をそのまま registerPath で $ref として参照できる。
 */
import { z } from 'zod/v4'
import { registry } from './setup.js'

// ─────────── 共通 ───────────────────────────────────────────
export const ErrorResponseSchema = registry.register(
    'ErrorResponse',
    z.object({
        code: z.string().openapi({ example: 'UNAUTHORIZED' }),
        message: z.string().openapi({ example: '認証が必要です' }),
    }).openapi({ title: 'エラーレスポンス' }),
)

// ─────────── Auth ────────────────────────────────────────────
/** POST /v1/auth/sessions のリクエストボディ（OpenAPI 専用 - パスワード方式） */
export const CreateSessionRequestSchema = registry.register(
    'CreateSessionRequest',
    z.discriminatedUnion('method', [
        z.object({
            method: z.literal('password').openapi({ example: 'password' }),
            email: z.string().email().openapi({ example: 'user@example.com' }),
            password: z.string().min(1).openapi({ example: 'Password1!' }),
        }),
        z.object({
            method: z.literal('oauth').openapi({ example: 'oauth' }),
            provider: z.enum(['google', 'line', 'apple']).openapi({ example: 'google' }),
            code: z.string().min(1).openapi({ example: 'authorization_code_here' }),
            redirectUri: z.string().optional(),
        }),
    ]).openapi({ title: 'セッション作成リクエスト' }),
)

/** POST /v1/auth/sessions のレスポンス */
export const SessionResponseSchema = registry.register(
    'SessionResponse',
    z.object({
        userId: z.string().uuid().openapi({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }),
        plan: z.enum(['FREE', 'SUBSCRIBER']).openapi({ example: 'FREE' }),
    }).openapi({ title: 'セッションレスポンス' }),
)

// ─────────── Announcement ────────────────────────────────────
const AttachmentSchema = z.object({
    id: z.string(),
    fileUrl: z.string().url(),
    mimeType: z.string(),
})

const ScheduleInfoSchema = z.object({
    scheduleId: z.string(),
    date: z.string().openapi({ example: '2026-06-01' }),
    startTime: z.string().openapi({ example: '10:00' }),
    endTime: z.string().openapi({ example: '12:00' }),
    scheduleStatus: z.string(),
}).nullable()

export const AnnouncementListItemSchema = registry.register(
    'AnnouncementListItem',
    z.object({
        id: z.string().uuid(),
        communityId: z.string(),
        activityId: z.string().nullable(),
        authorId: z.string(),
        authorName: z.string().nullable(),
        authorAvatarUrl: z.string().nullable(),
        communityName: z.string(),
        communityLogoUrl: z.string().nullable(),
        title: z.string(),
        content: z.string(),
        isRead: z.boolean(),
        isBookmarked: z.boolean(),
        isLiked: z.boolean(),
        likeCount: z.number().int(),
        commentCount: z.number().int(),
        readCount: z.number().int(),
        createdAt: z.string().datetime(),
        attachments: z.array(AttachmentSchema),
        scheduleInfo: ScheduleInfoSchema,
        activityDeleted: z.boolean(),
    }).openapi({ title: 'お知らせ一覧アイテム' }),
)

export const AnnouncementDetailSchema = registry.register(
    'AnnouncementDetail',
    z.object({
        id: z.string().uuid(),
        communityId: z.string(),
        activityId: z.string().nullable(),
        authorId: z.string(),
        authorName: z.string().nullable(),
        authorAvatarUrl: z.string().nullable(),
        communityName: z.string(),
        title: z.string(),
        content: z.string(),
        createdAt: z.string().datetime(),
        isRead: z.boolean(),
        isLiked: z.boolean(),
        isBookmarked: z.boolean(),
        likeCount: z.number().int(),
        commentCount: z.number().int(),
        readCount: z.number().int(),
        attachments: z.array(AttachmentSchema),
        scheduleInfo: ScheduleInfoSchema,
        activityDeleted: z.boolean(),
    }).openapi({ title: 'お知らせ詳細' }),
)

export const AnnouncementFeedItemSchema = AnnouncementListItemSchema

export const AnnouncementFeedResponseSchema = registry.register(
    'AnnouncementFeedResponse',
    z.object({
        items: z.array(AnnouncementFeedItemSchema),
        nextCursor: z.string().nullable(),
    }).openapi({ title: 'お知らせフィードレスポンス' }),
)

export const CreateAnnouncementRequestSchema = registry.register(
    'CreateAnnouncementRequest',
    z.object({
        title: z.string().min(1).openapi({ example: '重要なお知らせ' }),
        content: z.string().min(1).openapi({ example: '本文です' }),
        attachments: z.array(z.object({
            fileKey: z.string(),
            mimeType: z.string(),
        })).optional(),
    }).openapi({ title: 'お知らせ作成リクエスト' }),
)

export const CreateAnnouncementResponseSchema = registry.register(
    'CreateAnnouncementResponse',
    z.object({
        announcementId: z.string().uuid(),
    }).openapi({ title: 'お知らせ作成レスポンス' }),
)

export const UpdateAnnouncementRequestSchema = registry.register(
    'UpdateAnnouncementRequest',
    z.object({
        title: z.string().min(1).optional().openapi({ example: 'タイトル更新' }),
        content: z.string().min(1).optional().openapi({ example: '本文更新' }),
    }).openapi({ title: 'お知らせ更新リクエスト' }),
)

export const ToggleLikeResponseSchema = registry.register(
    'ToggleLikeResponse',
    z.object({ liked: z.boolean() }).openapi({ title: 'いいね状態レスポンス' }),
)

export const ToggleBookmarkResponseSchema = registry.register(
    'ToggleBookmarkResponse',
    z.object({ bookmarked: z.boolean() }).openapi({ title: 'ブックマーク状態レスポンス' }),
)

// ─────────── Community ───────────────────────────────────────
export const CreateCommunityRequestSchema = registry.register(
    'CreateCommunityRequest',
    z.object({
        name: z.string().min(1).max(100).openapi({ example: 'テニス同好会' }),
        description: z.string().max(2000).optional(),
        joinMethod: z.enum(['FREE_JOIN', 'APPROVAL', 'INVITATION']).optional(),
        isPublic: z.boolean().optional(),
        categoryIds: z.array(z.string()).min(1),
        maxMembers: z.number().int().optional(),
    }).openapi({ title: 'コミュニティ作成リクエスト' }),
)

export const UpdateCommunityRequestSchema = registry.register(
    'UpdateCommunityRequest',
    z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional(),
        logoUrl: z.string().url().nullable().optional(),
        joinMethod: z.enum(['FREE_JOIN', 'APPROVAL', 'INVITATION']).optional(),
        isPublic: z.boolean().optional(),
    }).openapi({ title: 'コミュニティ更新リクエスト' }),
)

export const CommunityListItemSchema = registry.register(
    'CommunityListItem',
    z.object({
        id: z.string().uuid(),
        name: z.string(),
        description: z.string().nullable(),
        logoUrl: z.string().nullable(),
        memberCount: z.number().int(),
        isPublic: z.boolean(),
        joinMethod: z.enum(['FREE_JOIN', 'APPROVAL', 'INVITATION']),
    }).openapi({ title: 'コミュニティ一覧アイテム' }),
)

// ─────────── Master ──────────────────────────────────────────
export const CategoryItemSchema = registry.register(
    'CategoryItem',
    z.object({
        id: z.string(),
        name: z.string(),
        iconKey: z.string().nullable(),
    }).openapi({ title: 'カテゴリアイテム' }),
)

export const ParticipationLevelItemSchema = registry.register(
    'ParticipationLevelItem',
    z.object({
        id: z.string(),
        level: z.number().int().min(0).max(8),
        label: z.string(),
    }).openapi({ title: '参加レベルアイテム' }),
)

// ─────────── User ────────────────────────────────────────────
export const UserProfileSchema = registry.register(
    'UserProfile',
    z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
        plan: z.enum(['FREE', 'SUBSCRIBER']),
        createdAt: z.string().datetime(),
    }).openapi({ title: 'ユーザープロフィール' }),
)
