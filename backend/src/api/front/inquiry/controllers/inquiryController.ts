import { usecaseFactory } from '@/api/_usecaseFactory.js'
import { z } from 'zod'

/**
 * Wave6 Phase 8-B 暫定実装メモ:
 * 既存 DDD レイヤ（UseCase / Repository / Domain）に従わず、Controller から薄い Repository のみを呼ぶ簡潔実装。
 * 理由: スレッドモデルが独立しており、ドメインロジックがほぼ CRUD+状態遷移のみのため。
 * 後続 Wave で UseCase / Domain Model に分離する（バックログ I-11 を参照）。
 */

// ============================================================
// 入力スキーマ
// ============================================================

export const createInquirySchema = z.object({
    categorySlug: z.string().min(1).max(100),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(10_000),
    /** 既にアップロード済みの添付ファイルキー（uploadClient で取得済の S3 key） */
    attachmentKeys: z
        .array(
            z.object({
                storageKey: z.string().min(1).max(500),
                fileName: z.string().min(1).max(255),
                mimeType: z.string().min(1).max(100),
                sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
            }),
        )
        .max(5)
        .optional()
        .default([]),
})

export const addMessageSchema = z.object({
    body: z.string().min(1).max(10_000),
    attachmentKeys: z
        .array(
            z.object({
                storageKey: z.string().min(1).max(500),
                fileName: z.string().min(1).max(255),
                mimeType: z.string().min(1).max(100),
                sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
            }),
        )
        .max(5)
        .optional()
        .default([]),
})

export const createAnonymousInquirySchema = createInquirySchema.extend({
    contactEmail: z.string().email().max(255),
    /** Google reCAPTCHA v3 トークン */
    recaptchaToken: z.string().min(1),
})

// ============================================================
// 共通ヘルパー
// ============================================================

async function findCategoryBySlug(slug: string) {
    return usecaseFactory.createInquiryRepository().findCategoryBySlug(slug)
}

function serializeInquiry(inq: {
    id: string
    title: string
    status: string
    lastActivityAt: Date
    createdAt: Date
    category: { slug: string; labelI18n: unknown }
    messages?: Array<{
        id: string
        authorType: string
        body: string
        createdAt: Date
        attachments: Array<{
            id: string
            fileName: string
            mimeType: string
            sizeBytes: number
            scanStatus: string
        }>
    }>
}) {
    return {
        id: inq.id,
        title: inq.title,
        status: inq.status,
        lastActivityAt: inq.lastActivityAt.toISOString(),
        createdAt: inq.createdAt.toISOString(),
        category: { slug: inq.category.slug, labelI18n: inq.category.labelI18n },
        messages:
            inq.messages?.map((m) => ({
                id: m.id,
                authorType: m.authorType,
                body: m.body,
                createdAt: m.createdAt.toISOString(),
                attachments: m.attachments.map((a) => ({
                    id: a.id,
                    fileName: a.fileName,
                    mimeType: a.mimeType,
                    sizeBytes: a.sizeBytes,
                    scanStatus: a.scanStatus,
                })),
            })) ?? [],
    }
}

// ============================================================
// 認証ユーザー向け Controller
// ============================================================

import type { NextFunction, Request, Response } from 'express'
import { notifyOperatorsOfNewInquiry, notifyUserOfOperatorReply } from '../service/inquiryNotificationService.js'

export const inquiryController = {
    /** GET /v1/inquiries/categories — カテゴリ一覧（フォーム表示用） */
    async listCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const includeAnonymous = req.query.includeAnonymous === 'true'
            const cats = await usecaseFactory.createInquiryRepository().listCategories({ includeAnonymous })
            res.status(200).json({ categories: cats })
        } catch (err) {
            next(err)
        }
    },

    /** POST /v1/inquiries/anonymous — 匿名（未認証）問い合わせ作成 */
    async createAnonymous(req: Request, res: Response, next: NextFunction) {
        try {
            const input = createAnonymousInquirySchema.parse(req.body)

            const category = await findCategoryBySlug(input.categorySlug)
            if (!category || !category.isActive || !category.isAnonymousOnly) {
                // 匿名ルートでは isAnonymousOnly カテゴリのみ受け付ける
                res.status(400).json({
                    code: 'INVALID_CATEGORY',
                    message: 'このカテゴリは匿名ルートでは使用できません',
                })
                return
            }

            // reCAPTCHA 検証（環境変数で有効化されているときのみ）
            const { verifyRecaptchaToken } = await import('../service/recaptchaVerifier.js')
            const captchaOk = await verifyRecaptchaToken(input.recaptchaToken, req.ip ?? undefined)
            if (!captchaOk) {
                res.status(400).json({ code: 'RECAPTCHA_FAILED', message: 'reCAPTCHA 検証に失敗しました' })
                return
            }

            const created = await usecaseFactory.createInquiryRepository().createAnonymousInquiry({
                contactEmail: input.contactEmail,
                categoryId: category.id,
                title: input.title,
                body: input.body,
                attachments: input.attachmentKeys,
            })

            notifyOperatorsOfNewInquiry({
                inquiryId: created.id,
                title: input.title,
                categoryLabel: category.labelI18n as Record<string, string>,
                isAnonymous: true,
            }).catch((err) =>
                console.warn('[inquiry] Slack 通知失敗（無視して継続）:', err),
            )

            // 匿名問い合わせは ID のみ返す（スレッド閲覧不可、運営返信はメール送信のみ）
            res.status(201).json({ id: created.id })
        } catch (err) {
            next(err)
        }
    },
}

// ============================================================
// 運営側 Controller（Phase 8-C）
// ============================================================

export const adminInquiryController = {
    /** GET /v1/admin/inquiries — 一覧（status / categorySlug / assignee でフィルタ） */
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const status = req.query.status as string | undefined
            const categorySlug = req.query.category as string | undefined
            // Wave6 Phase 9b-16: assignee フィルタ
            //   - 'me'      ：ログイン中オペレーターの担当
            //   - 'unassigned': 未割当
            //   - undefined : 全件
            const assigneeFilter = req.query.assignee as string | undefined
            const operatorUserId = req.user?.userId

            const items = await usecaseFactory.createInquiryRepository().listAdmin({
                status,
                categorySlug,
                assigneeFilterMode:
                    assigneeFilter === 'me' ? 'me' : assigneeFilter === 'unassigned' ? 'unassigned' : 'all',
                assigneeUserId: operatorUserId ?? null,
            })

            res.status(200).json({
                inquiries: items.map((it) => ({
                    id: it.id,
                    title: it.title,
                    status: it.status,
                    lastActivityAt: it.lastActivityAt.toISOString(),
                    createdAt: it.createdAt.toISOString(),
                    category: { slug: it.category.slug, labelI18n: it.category.labelI18n },
                    user: it.user,
                    contactEmail: it.contactEmail,
                    assignee: it.assignee,
                })),
            })
        } catch (err) {
            next(err)
        }
    },

    /** GET /v1/admin/inquiries/:id — 詳細（任意の Inquiry にアクセス可） */
    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const inq = await usecaseFactory.createInquiryRepository().findByIdAdmin(id)
            if (!inq) {
                res.status(404).json({ code: 'NOT_FOUND', message: 'Not Found' })
                return
            }
            res.status(200).json({
                ...serializeInquiry(inq),
                user: inq.user,
                contactEmail: inq.contactEmail,
                assignee: inq.assignee,
            })
        } catch (err) {
            next(err)
        }
    },

    /** PATCH /v1/admin/inquiries/:id/status — ステータス変更 */
    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const schema = z.object({
                status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
            })
            const { status } = schema.parse(req.body)

            const updated = await usecaseFactory.createInquiryRepository().updateStatus(id, status)
            res.status(200).json(updated)
        } catch (err) {
            next(err)
        }
    },

    /** POST /v1/admin/inquiries/:id/messages — 運営返信 */
    async addOperatorMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const operatorUserId = req.user!.userId
            const { id } = req.params
            const input = addMessageSchema.parse(req.body)

            const inquiryRepo = usecaseFactory.createInquiryRepository()
            const inq = await inquiryRepo.findCoreById(id)
            if (!inq) {
                res.status(404).json({ code: 'NOT_FOUND', message: 'Not Found' })
                return
            }

            const { message } = await inquiryRepo.addOperatorMessage({
                inquiryId: id,
                operatorUserId,
                body: input.body,
                attachments: input.attachmentKeys,
            })

            // 副作用: ユーザーへのアプリ内通知
            if (inq.userId) {
                notifyUserOfOperatorReply({
                    userId: inq.userId,
                    inquiryId: id,
                    inquiryTitle: inq.title,
                }).catch((err) =>
                    console.warn('[inquiry] アプリ内通知失敗（無視して継続）:', err),
                )
            }

            res.status(201).json({
                id: message.id,
                authorType: message.authorType,
                body: message.body,
                createdAt: message.createdAt.toISOString(),
                attachments: message.attachments.map((a) => ({
                    id: a.id,
                    fileName: a.fileName,
                    mimeType: a.mimeType,
                    sizeBytes: a.sizeBytes,
                    scanStatus: a.scanStatus,
                })),
            })
        } catch (err) {
            next(err)
        }
    },

    /** PATCH /v1/admin/inquiries/:id/assignee — 担当オペレーターを設定/解除 (Wave6 Phase 9b-16) */
    async updateAssignee(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const schema = z.object({
                assigneeUserId: z.string().uuid().nullable(),
            })
            const { assigneeUserId } = schema.parse(req.body)

            // 設定する場合は SystemAdmin (OPERATOR / SUPER_ADMIN) であることを検証
            if (assigneeUserId !== null) {
                const target = await usecaseFactory.createUserRepository().findSystemAdminForAssignee(assigneeUserId)
                if (!target || target.deletedAt || (target.systemRole !== 'OPERATOR' && target.systemRole !== 'SUPER_ADMIN')) {
                    res.status(400).json({
                        code: 'INVALID_ASSIGNEE',
                        message: '担当者は SystemAdmin (OPERATOR / SUPER_ADMIN) である必要があります',
                    })
                    return
                }
            }

            const updated = await usecaseFactory.createInquiryRepository().updateAssignee(id, assigneeUserId)
            res.status(200).json(updated)
        } catch (err) {
            next(err)
        }
    },

    /** GET /v1/admin/system-admins — SystemAdmin ユーザー一覧（担当プルダウン用） */
    async listSystemAdmins(_req: Request, res: Response, next: NextFunction) {
        try {
            const users = await usecaseFactory.createUserRepository().listSystemAdmins()
            res.status(200).json({ users })
        } catch (err) {
            next(err)
        }
    },
}
