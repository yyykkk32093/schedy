/**
 * OpenAPI パスの登録
 *
 * 登録する feature:
 *  - Auth (セッション作成・削除)
 *  - Announcement (フィード・詳細・既読・いいね・ブックマーク・CRUD)
 *  - Community (一覧・作成・取得・更新)
 *  - Master (カテゴリ・参加レベル)
 *  - User (プロフィール取得)
 */
import { z } from 'zod/v4'
import { registry } from './setup.js'
import {
    AnnouncementDetailSchema,
    AnnouncementFeedResponseSchema,
    AnnouncementListItemSchema,
    CategoryItemSchema,
    CommunityListItemSchema,
    CreateAnnouncementRequestSchema,
    CreateAnnouncementResponseSchema,
    CreateCommunityRequestSchema,
    CreateSessionRequestSchema,
    ErrorResponseSchema,
    ParticipationLevelItemSchema,
    SessionResponseSchema,
    ToggleBookmarkResponseSchema,
    ToggleLikeResponseSchema,
    UpdateAnnouncementRequestSchema,
    UpdateCommunityRequestSchema,
    UserProfileSchema,
} from './registerSchemas.js'

// ── 共通ヘルパー ────────────────────────────────────────────
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
})

const authRequired = [{ [bearerAuth.name]: [] }]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonResponse = (description: string, schema: any) => ({
    description,
    content: { 'application/json': { schema } },
})

const noBody = (description: string) => ({ description })

const errorResponses = {
    401: jsonResponse('認証エラー', ErrorResponseSchema),
    403: jsonResponse('権限エラー', ErrorResponseSchema),
    404: jsonResponse('Not Found', ErrorResponseSchema),
    422: jsonResponse('バリデーションエラー', ErrorResponseSchema),
    500: jsonResponse('サーバーエラー', ErrorResponseSchema),
}

// ── Auth ─────────────────────────────────────────────────────
registry.registerPath({
    method: 'post',
    path: '/v1/auth/sessions',
    summary: 'ログイン（セッション作成）',
    description: 'パスワード認証または OAuth 認証でセッションを作成する。httpOnly Cookie にトークンをセット。',
    tags: ['Auth'],
    request: {
        body: { content: { 'application/json': { schema: CreateSessionRequestSchema } }, required: true },
    },
    responses: {
        201: jsonResponse('ログイン成功', SessionResponseSchema),
        401: jsonResponse('認証失敗', ErrorResponseSchema),
        422: jsonResponse('バリデーションエラー', ErrorResponseSchema),
    },
})

registry.registerPath({
    method: 'delete',
    path: '/v1/auth/sessions',
    summary: 'ログアウト（セッション削除）',
    tags: ['Auth'],
    security: authRequired,
    responses: {
        204: noBody('ログアウト成功'),
        401: errorResponses[401],
    },
})

// ── Announcement ─────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/v1/announcements/feed',
    summary: 'お知らせフィード取得',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        query: z.object({
            cursor: z.string().optional().openapi({ description: 'ページングカーソル' }),
            limit: z.coerce.number().int().optional().openapi({ default: 20 }),
            activityFilter: z.enum(['true', 'false']).optional().openapi({ description: 'アクティビティ連動フィルタ' }),
        }),
    },
    responses: {
        200: jsonResponse('フィード取得成功', AnnouncementFeedResponseSchema),
        ...errorResponses,
    },
})

registry.registerPath({
    method: 'get',
    path: '/v1/communities/{communityId}/announcements',
    summary: 'コミュニティ内お知らせ一覧',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ communityId: z.string().uuid() }),
    },
    responses: {
        200: jsonResponse('一覧取得成功', AnnouncementListItemSchema),
        ...errorResponses,
    },
})

registry.registerPath({
    method: 'post',
    path: '/v1/communities/{communityId}/announcements',
    summary: 'お知らせ作成',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ communityId: z.string().uuid() }),
        body: { content: { 'application/json': { schema: CreateAnnouncementRequestSchema } }, required: true },
    },
    responses: {
        201: jsonResponse('作成成功', CreateAnnouncementResponseSchema),
        403: errorResponses[403],
        422: errorResponses[422],
    },
})

registry.registerPath({
    method: 'get',
    path: '/v1/announcements/{id}',
    summary: 'お知らせ詳細取得',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
    },
    responses: {
        200: jsonResponse('詳細取得成功', AnnouncementDetailSchema),
        404: errorResponses[404],
    },
})

registry.registerPath({
    method: 'patch',
    path: '/v1/announcements/{id}',
    summary: 'お知らせ更新',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateAnnouncementRequestSchema } }, required: true },
    },
    responses: {
        200: jsonResponse('更新成功', AnnouncementDetailSchema),
        403: errorResponses[403],
    },
})

registry.registerPath({
    method: 'delete',
    path: '/v1/announcements/{id}',
    summary: 'お知らせ削除（論理削除）',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
    },
    responses: {
        204: noBody('削除成功'),
        403: errorResponses[403],
    },
})

registry.registerPath({
    method: 'post',
    path: '/v1/announcements/{id}/reads',
    summary: '既読マーク（冪等）',
    description: '既に既読でも 204 を返す冪等な操作。',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
    },
    responses: {
        204: noBody('既読登録成功'),
        401: errorResponses[401],
    },
})

registry.registerPath({
    method: 'post',
    path: '/v1/announcements/{id}/likes',
    summary: 'いいね追加（冪等）',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
    },
    responses: {
        200: jsonResponse('いいね追加成功', ToggleLikeResponseSchema),
        401: errorResponses[401],
    },
})

registry.registerPath({
    method: 'delete',
    path: '/v1/announcements/{id}/likes',
    summary: 'いいね削除（冪等）',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
    },
    responses: {
        200: jsonResponse('いいね削除成功', ToggleLikeResponseSchema),
        401: errorResponses[401],
    },
})

registry.registerPath({
    method: 'post',
    path: '/v1/announcements/{id}/bookmarks',
    summary: 'ブックマーク追加（冪等）',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
    },
    responses: {
        201: jsonResponse('ブックマーク追加成功', ToggleBookmarkResponseSchema),
        401: errorResponses[401],
    },
})

registry.registerPath({
    method: 'delete',
    path: '/v1/announcements/{id}/bookmarks',
    summary: 'ブックマーク削除（冪等）',
    tags: ['Announcement'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
    },
    responses: {
        200: jsonResponse('ブックマーク削除成功', ToggleBookmarkResponseSchema),
        401: errorResponses[401],
    },
})

// ── Community ─────────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/v1/communities',
    summary: 'コミュニティ一覧取得',
    tags: ['Community'],
    security: authRequired,
    responses: {
        200: jsonResponse('一覧取得成功', CommunityListItemSchema),
        ...errorResponses,
    },
})

registry.registerPath({
    method: 'post',
    path: '/v1/communities',
    summary: 'コミュニティ作成',
    tags: ['Community'],
    security: authRequired,
    request: {
        body: { content: { 'application/json': { schema: CreateCommunityRequestSchema } }, required: true },
    },
    responses: {
        201: jsonResponse('作成成功', CommunityListItemSchema),
        422: errorResponses[422],
    },
})

registry.registerPath({
    method: 'patch',
    path: '/v1/communities/{id}',
    summary: 'コミュニティ更新',
    tags: ['Community'],
    security: authRequired,
    request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateCommunityRequestSchema } }, required: true },
    },
    responses: {
        200: jsonResponse('更新成功', CommunityListItemSchema),
        403: errorResponses[403],
    },
})

// ── Master ────────────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/v1/categories',
    summary: 'カテゴリ一覧取得',
    tags: ['Master'],
    responses: {
        200: jsonResponse('カテゴリ一覧', CategoryItemSchema),
    },
})

registry.registerPath({
    method: 'get',
    path: '/v1/participation-levels',
    summary: '参加レベル一覧取得',
    tags: ['Master'],
    responses: {
        200: jsonResponse('参加レベル一覧', ParticipationLevelItemSchema),
    },
})

// ── User ──────────────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/v1/users/me',
    summary: '自分のプロフィール取得',
    tags: ['User'],
    security: authRequired,
    responses: {
        200: jsonResponse('プロフィール取得成功', UserProfileSchema),
        401: errorResponses[401],
    },
})
