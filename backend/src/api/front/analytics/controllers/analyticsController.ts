import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * analyticsController — 統計・分析 API コントローラ（UBL-17〜19）
 */
export const analyticsController = {
    /** UBL-17: コミュニティ統計 */
    async stats(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const useCase = usecaseFactory.createGetCommunityStatsUseCase()
            const result = await useCase.execute({ communityId })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    /** UBL-19: 参加者推移 */
    async trend(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { from, to } = req.query as { from?: string; to?: string }
            const useCase = usecaseFactory.createGetParticipationTrendUseCase()
            const result = await useCase.execute({ communityId, from, to })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    /** UBL-18: 欠席・キャンセル分析 */
    async absences(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { from, to } = req.query as { from?: string; to?: string }
            const useCase = usecaseFactory.createGetAbsenceReportUseCase()
            const result = await useCase.execute({ communityId, from, to })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },
}
