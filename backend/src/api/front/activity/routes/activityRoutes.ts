import { prisma } from '@/_sharedTech/db/client.js'
import { featureGateService } from '@/_sharedTech/featureGate/featureGateServiceInstance.js'
import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { requireCommunityFeature } from '@/api/middleware/featureGateMiddleware.js'
import { CommunityFeature } from '@/domains/_sharedDomains/featureGate/CommunityFeature.js'
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { activityController } from '../controllers/activityController.js'

/**
 * recurrenceRule が送られた場合のみ AUTO_SCHEDULE FeatureGate を通す
 * (POST: communityId は params にある)
 */
function requireAutoScheduleIfRecurrenceCreate(req: Request, res: Response, next: NextFunction): void {
    if (req.body?.recurrenceRule) {
        const gate = requireCommunityFeature(
            CommunityFeature.AUTO_SCHEDULE,
            (r) => r.params.communityId,
        )
        gate(req, res, next)
        return
    }
    next()
}

/**
 * recurrenceRule が送られた場合のみ AUTO_SCHEDULE FeatureGate を通す
 * (PATCH: communityId は Activity から引く)
 */
async function requireAutoScheduleIfRecurrenceUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.body?.recurrenceRule) {
        next()
        return
    }

    const activityId = req.params.id
    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { communityId: true },
    })
    if (!activity) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'アクティビティが見つかりません' })
        return
    }

    const community = await prisma.community.findUnique({
        where: { id: activity.communityId },
        select: { grade: true },
    })
    if (!community) {
        res.status(404).json({ code: 'COMMUNITY_NOT_FOUND', message: 'コミュニティが見つかりません' })
        return
    }

    const enabled = await featureGateService.canUseCommunity(community.grade, CommunityFeature.AUTO_SCHEDULE)
    if (!enabled) {
        res.status(403).json({
            code: 'COMMUNITY_FEATURE_RESTRICTED',
            message: '定例スケジュール機能はPREMIUMグレードのコミュニティでのみ利用可能です',
            feature: CommunityFeature.AUTO_SCHEDULE,
        })
        return
    }

    next()
}

const router = Router()

// Community 配下の Activity CRUD
router.post('/v1/communities/:communityId/activities', authMiddleware, requireAutoScheduleIfRecurrenceCreate, activityController.create)
router.get('/v1/communities/:communityId/activities', authMiddleware, activityController.list)

// Activity 単体操作
router.get('/v1/activities/:id', authMiddleware, activityController.findById)
router.patch('/v1/activities/:id', authMiddleware, requireAutoScheduleIfRecurrenceUpdate, activityController.update)
router.delete('/v1/activities/:id', authMiddleware, activityController.softDelete)

export default router
