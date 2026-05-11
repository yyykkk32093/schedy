/**
 * Community Location API Routes
 *
 * コミュニティの活動拠点（MAIN/SUB）を管理する CRUD エンドポイント。
 * OWNER/ADMIN 以上のみ変更可能。
 */
import { usecaseFactory } from '@/api/_usecaseFactory.js'
import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import { saveLocationsSchema } from '@/api/schemas/index.js'
import { randomUUID } from 'crypto'
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'

const router = Router()

/**
 * GET /v1/communities/:communityId/locations
 * コミュニティの活動拠点一覧（メンバーであれば閲覧可能）
 */
router.get(
    '/v1/communities/:communityId/locations',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId
            const { communityId } = req.params
            const result = await usecaseFactory.createListCommunityLocationsUseCase().execute({
                communityId,
                userId,
            })
            res.json(result)
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
            const { locations } = req.body as {
                locations: Array<{ type: 'MAIN' | 'SUB'; area: string; station?: string }>
            }

            if (!Array.isArray(locations)) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'locations 配列が必要です' })
                return
            }

            const result = await usecaseFactory.createReplaceCommunityLocationsUseCase().execute({
                communityId,
                userId,
                locations: locations.map((loc, index) => ({
                    id: randomUUID(),
                    type: loc.type,
                    area: loc.area,
                    station: loc.station ?? null,
                    sortOrder: index,
                })),
            })

            res.json(result)
        } catch (err) {
            next(err)
        }
    },
)

/**
 * POST /v1/communities/:communityId/locations
 * DELETE /v1/communities/:communityId/locations/:locationId
 *
 * Phase 1 [202603_08]: フロント未使用のため削除済み。
 * フロントは PUT bulk のみ使用する。
 */

export default router
