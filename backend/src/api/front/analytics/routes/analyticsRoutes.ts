import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { requireCommunityFeature } from '@/api/middleware/featureGateMiddleware.js'
import { Router } from 'express'
import { analyticsController } from '../controllers/analyticsController.js'

const router = Router()

const communityIdFromParams = (req: { params: Record<string, string> }) =>
    req.params.communityId

// UBL-17: コミュニティ統計
router.get(
    '/v1/communities/:communityId/analytics/stats',
    authMiddleware,
    requireCommunityFeature('ANALYTICS_REPORT', communityIdFromParams),
    analyticsController.stats,
)

// UBL-19: 参加者推移
router.get(
    '/v1/communities/:communityId/analytics/trend',
    authMiddleware,
    requireCommunityFeature('ANALYTICS_REPORT', communityIdFromParams),
    analyticsController.trend,
)

// UBL-18: 欠席・キャンセル分析
router.get(
    '/v1/communities/:communityId/analytics/absences',
    authMiddleware,
    requireCommunityFeature('ANALYTICS_REPORT', communityIdFromParams),
    analyticsController.absences,
)

export default router
