import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { masterController } from '../controllers/masterController.js'

const router = Router()

// 全マスタデータを一括取得（作成フォーム用）
router.get('/v1/masters/community', authMiddleware, masterController.getAllMasters)

// 個別マスタ取得
router.get('/v1/masters/community-types', authMiddleware, masterController.getCommunityTypes)
router.get('/v1/masters/categories', authMiddleware, masterController.getCategories)
router.get('/v1/masters/participation-levels', authMiddleware, masterController.getParticipationLevels)

export default router
