import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { masterController } from '../controllers/masterController.js'

const router = Router()

// Phase 3 (REST 再設計): /v1/masters/* を解体 → 個別リソース化
//   旧: GET /v1/masters/categories            → 新: GET /v1/categories
//   旧: GET /v1/masters/participation-levels  → 新: GET /v1/participation-levels
//   旧: GET /v1/masters/community             → 廃止（フロント側で /v1/categories と
//                                                /v1/participation-levels を並列取得）
router.get('/v1/categories', authMiddleware, masterController.getCategories)
router.get('/v1/participation-levels', authMiddleware, masterController.getParticipationLevels)

export default router
