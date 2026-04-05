/**
 * Community Tag API Routes
 *
 * コミュニティのタグを管理する CRUD エンドポイント。
 * OWNER/ADMIN 以上のみ変更可能。
 */
import { prisma } from '@/_sharedTech/db/client.js'
import { featureGateService } from '@/_sharedTech/featureGate/featureGateServiceInstance.js'
import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import { saveTagsSchema } from '@/api/schemas/index.js'
import { CommunityLimitKey } from '@/domains/_sharedDomains/featureGate/CommunityFeature.js'
import { randomUUID } from 'crypto'
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'

const router = Router()

// ──────────────────────────────────────────
// 共通: ADMIN以上の権限チェック
// ──────────────────────────────────────────
async function requireCommunityAdmin(
    userId: string,
    communityId: string,
): Promise<void> {
    const membership = await prisma.communityMembership.findUnique({
        where: { communityId_userId: { communityId, userId } },
        select: { role: true, leftAt: true },
    })
    if (!membership || membership.leftAt) {
        const err = new Error('コミュニティに所属していません') as Error & { status: number; code: string }
        err.status = 403; err.code = 'FORBIDDEN'; throw err
    }
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        const err = new Error('管理者以上の権限が必要です') as Error & { status: number; code: string }
        err.status = 403; err.code = 'FORBIDDEN'; throw err
    }
}

/**
 * GET /v1/communities/:communityId/tags
 * コミュニティのタグ一覧（メンバーであれば閲覧可能）
 */
router.get(
    '/v1/communities/:communityId/tags',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { communityId } = req.params
            const tags = await prisma.communityTag.findMany({
                where: { communityId },
                select: { tag: true },
                orderBy: { tag: 'asc' },
            })
            res.json({ tags: tags.map((t) => t.tag) })
        } catch (err) {
            next(err)
        }
    },
)

/**
 * PUT /v1/communities/:communityId/tags
 * タグ一括保存（フロントの設定画面から全件送信して入れ替え）
 *
 * Body: { tags: string[] }
 */
router.put(
    '/v1/communities/:communityId/tags',
    authMiddleware,
    validateBody(saveTagsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId
            const { communityId } = req.params
            await requireCommunityAdmin(userId, communityId)

            const { tags } = req.body as { tags: string[] }

            if (!Array.isArray(tags)) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'tags 配列が必要です' })
                return
            }

            // 重複除去 & 空文字除外 & トリム
            const uniqueTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))]

            // タグ上限チェック
            const community = await prisma.community.findUnique({
                where: { id: communityId },
                select: { grade: true },
            })
            if (!community) {
                res.status(404).json({ code: 'NOT_FOUND', message: 'コミュニティが見つかりません' })
                return
            }

            const maxTags = await featureGateService.getCommunityLimit(
                community.grade,
                CommunityLimitKey.MAX_TAGS,
            )
            if (maxTags !== -1 && uniqueTags.length > maxTags) {
                res.status(400).json({
                    code: 'TAG_LIMIT_EXCEEDED',
                    message: `タグ数が上限を超えています（上限: ${maxTags}件、指定: ${uniqueTags.length}件）`,
                })
                return
            }

            // トランザクションで delete → createMany
            await prisma.$transaction(async (tx) => {
                await tx.communityTag.deleteMany({ where: { communityId } })
                if (uniqueTags.length > 0) {
                    await tx.communityTag.createMany({
                        data: uniqueTags.map((tag) => ({
                            id: randomUUID(),
                            communityId,
                            tag,
                        })),
                    })
                }
            })

            res.json({ tags: uniqueTags })
        } catch (err) {
            next(err)
        }
    },
)

export default router
