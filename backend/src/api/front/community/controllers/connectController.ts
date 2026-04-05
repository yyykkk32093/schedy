/**
 * Stripe Connect Onboarding API コントローラ
 *
 * OWNER 権限チェックはルート側の authMiddleware + コントローラ内で実施。
 */

import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const connectController = {
    /**
     * POST /v1/communities/:communityId/connect/onboarding
     * オンボーディングURLを生成して返す
     */
    async startOnboarding(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { refreshUrl, returnUrl } = req.body as {
                refreshUrl: string
                returnUrl: string
            }

            const useCase = usecaseFactory.createStartStripeConnectOnboardingUseCase()
            const result = await useCase.execute({
                communityId,
                refreshUrl,
                returnUrl,
            })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /**
     * GET /v1/communities/:communityId/connect/status
     * Connect アカウントのステータスを取得
     */
    async getStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params

            const useCase = usecaseFactory.createGetStripeConnectStatusUseCase()
            const result = await useCase.execute({ communityId })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /**
     * POST /v1/communities/:communityId/connect/dashboard-link
     * Stripe Express ダッシュボードログインリンクを生成
     */
    async createDashboardLink(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params

            const useCase = usecaseFactory.createCreateStripeDashboardLinkUseCase()
            const result = await useCase.execute({ communityId })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },
}
