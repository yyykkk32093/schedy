/**
 * Community Location API Routes
 *
 * コミュニティの活動拠点（MAIN/SUB）を管理する CRUD エンドポイント。
 * OWNER/ADMIN 以上のみ変更可能。
 */
import { prisma } from '@/_sharedTech/db/client.js'
import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import { addLocationSchema, saveLocationsSchema } from '@/api/schemas/index.js'
import { CommunityLocationRepositoryImpl } from '@/domains/community/repository/CommunityLocationRepositoryImpl.js'
import type { CreateCommunityLocationInput } from '@/domains/community/repository/ICommunityLocationRepository.js'
import { randomUUID } from 'crypto'
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'

const router = Router()

// ──────────────────────────────────────────
// 共通: ADMIN以上の権限チェック
// ──────────────────────────────────────────
async function requireCommunityAdmin(
    userId: string, communityId: string,
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
 * GET /v1/communities/:communityId/locations
 * コミュニティの活動拠点一覧（メンバーであれば閲覧可能）
 */
router.get(
    '/v1/communities/:communityId/locations',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { communityId } = req.params
            const repo = new CommunityLocationRepositoryImpl(prisma)
            const locations = await repo.findByCommunityId(communityId)
            res.json({ locations })
        } catch (err) {
            next(err)
        }
    },
)

/**
 * PUT /v1/communities/:communityId/locations
 * 一括保存（フロントの設定画面から全件送信して入れ替え）
 *
 * Body: { locations: Array<{ type: 'MAIN'|'SUB', area: string, station?: string }> }
 */
router.put(
    '/v1/communities/:communityId/locations',
    authMiddleware,
    validateBody(saveLocationsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId
            const { communityId } = req.params
            await requireCommunityAdmin(userId, communityId)

            const { locations } = req.body as {
                locations: Array<{ type: 'MAIN' | 'SUB'; area: string; station?: string }>
            }

            if (!Array.isArray(locations)) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'locations 配列が必要です' })
                return
            }

            // MAIN は最大1件
            const mainCount = locations.filter((l) => l.type === 'MAIN').length
            if (mainCount > 1) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'MAIN は1件のみ設定可能です' })
                return
            }

            const inputs: CreateCommunityLocationInput[] = locations.map((loc, index) => ({
                id: randomUUID(),
                communityId,
                type: loc.type,
                area: loc.area,
                station: loc.station ?? null,
                sortOrder: index,
            }))

            const result = await prisma.$transaction(async (tx) => {
                const repo = new CommunityLocationRepositoryImpl(tx)
                return repo.replaceAll(communityId, inputs)
            })

            res.json({ locations: result })
        } catch (err) {
            next(err)
        }
    },
)

/**
 * POST /v1/communities/:communityId/locations
 * 活動拠点を追加
 */
router.post(
    '/v1/communities/:communityId/locations',
    authMiddleware,
    validateBody(addLocationSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId
            const { communityId } = req.params
            await requireCommunityAdmin(userId, communityId)

            const { type, area, station } = req.body as {
                type: 'MAIN' | 'SUB'
                area: string
                station?: string
            }

            if (!area) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'area は必須です' })
                return
            }

            // MAIN の重複チェック
            if (type === 'MAIN') {
                const repo = new CommunityLocationRepositoryImpl(prisma)
                const existing = await repo.findByCommunityId(communityId)
                if (existing.some((l) => l.type === 'MAIN')) {
                    res.status(400).json({ code: 'INVALID_REQUEST', message: 'MAIN は既に存在します' })
                    return
                }
            }

            const repo = new CommunityLocationRepositoryImpl(prisma)
            const existing = await repo.findByCommunityId(communityId)
            const sortOrder = existing.length

            const location = await repo.create({
                id: randomUUID(),
                communityId,
                type: type ?? 'SUB',
                area,
                station: station ?? null,
                sortOrder,
            })

            res.status(201).json({ location })
        } catch (err) {
            next(err)
        }
    },
)

/**
 * DELETE /v1/communities/:communityId/locations/:locationId
 * 活動拠点を削除
 */
router.delete(
    '/v1/communities/:communityId/locations/:locationId',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId
            const { communityId, locationId } = req.params
            await requireCommunityAdmin(userId, communityId)

            const repo = new CommunityLocationRepositoryImpl(prisma)
            const location = await repo.findById(locationId)
            if (!location || location.communityId !== communityId) {
                res.status(404).json({ code: 'NOT_FOUND', message: '活動拠点が見つかりません' })
                return
            }

            await repo.delete(locationId)
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
)

export default router
