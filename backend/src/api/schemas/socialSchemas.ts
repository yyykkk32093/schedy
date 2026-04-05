/**
 * Social — Announcement / Chat / DM / Poll / Album / Stamp / Reaction
 */
import { z } from 'zod/v4'

// ── Announcement ──

/** POST /v1/communities/:communityId/announcements */
export const createAnnouncementSchema = z.object({
    title: z.string().min(1, 'タイトルは必須です').max(200),
    content: z.string().min(1, '本文は必須です').max(10000),
    attachments: z
        .array(
            z.object({
                fileUrl: z.string().url(),
                fileName: z.string(),
                mimeType: z.string(),
                fileSize: z.number().int().min(1),
            }),
        )
        .optional(),
})

/** PATCH /v1/announcements/:id */
export const updateAnnouncementSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(10000),
})

/** POST /v1/announcements/:id/comments */
export const createCommentSchema = z.object({
    content: z.string().min(1, 'コメントは必須です').max(2000),
})

// ── Chat ──

/** POST /v1/channels/:channelId/messages */
export const sendMessageSchema = z.object({
    content: z.string().min(1, 'メッセージは必須です').max(5000),
    mentions: z.array(z.string().uuid()).optional(),
    parentMessageId: z.string().uuid().optional(),
})

// ── DM ──

/** POST /v1/dm/channels */
export const createDMSchema = z.object({
    participantIds: z.array(z.string().uuid()).min(1, '参加者は1人以上必要です'),
})

// ── Poll ──

/** POST /v1/communities/:communityId/polls */
export const createPollSchema = z.object({
    question: z.string().min(1, '質問は必須です').max(500),
    options: z.array(z.string().min(1).max(200)).min(2, '選択肢は2つ以上必要です').max(20),
    isMultipleChoice: z.boolean().optional(),
    deadline: z.string().optional(),
    announcementId: z.string().uuid().optional(),
})

/** POST /v1/polls/:pollId/vote */
export const votePollSchema = z.object({
    optionIds: z.array(z.string().uuid()).min(1, '1つ以上選択してください'),
})

// ── Album ──

/** POST /v1/communities/:communityId/albums */
export const createAlbumSchema = z.object({
    title: z.string().min(1, 'アルバム名は必須です').max(100),
    description: z.string().max(1000).optional(),
})

/** POST /v1/albums/:albumId/photos */
export const addAlbumPhotoSchema = z.object({
    fileUrl: z.string().url(),
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number().int().min(1),
})

// ── Stamp ──

/** POST /v1/stamps */
export const createStampSchema = z.object({
    name: z.string().min(1, 'スタンプ名は必須です').max(30),
    imageUrl: z.string().url('有効なURLを入力してください'),
})

// ── Reaction ──

/** POST /v1/messages/:messageId/reactions */
export const addReactionSchema = z.object({
    stampId: z.string().uuid().optional(),
    emoji: z.string().max(10).optional(),
})
