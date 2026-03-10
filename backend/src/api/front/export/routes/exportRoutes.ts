import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import {
    requireCommunityFeature,
    requireFeature,
} from '@/api/middleware/featureGateMiddleware.js'
import { Router } from 'express'
import { exportController } from '../controllers/exportController.js'

const router = Router()

const communityIdFromParams = (req: { params: Record<string, string> }) =>
    req.params.communityId

// UBL-20: 参加状況 CSV 出力
router.get(
    '/v1/communities/:communityId/export/participation-csv',
    authMiddleware,
    requireCommunityFeature('CSV_EXPORT', communityIdFromParams),
    exportController.participationCsv,
)

// UBL-21: 会計情報出力（CSV / PDF）
router.get(
    '/v1/communities/:communityId/export/accounting',
    authMiddleware,
    requireCommunityFeature('ACCOUNTING_EXPORT', communityIdFromParams),
    exportController.accounting,
)

// UBL-22: カレンダーエクスポート（iCal）
router.get(
    '/v1/users/me/export/calendar.ics',
    authMiddleware,
    requireFeature('CALENDAR_EXPORT'),
    exportController.calendarIcal,
)

export default router
