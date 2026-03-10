import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const userScheduleController = {
    /**
     * GET /v1/users/me/schedules?from=YYYY-MM-DD&to=YYYY-MM-DD
     * ユーザーが所属する全コミュニティのスケジュールを日付範囲で横断取得
     */
    async listMySchedules(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const { from, to } = req.query as { from?: string; to?: string }

            if (!from || !to) {
                res.status(400).json({
                    code: 'INVALID_QUERY',
                    message: 'from と to クエリパラメータは必須です（YYYY-MM-DD 形式）',
                })
                return
            }

            const useCase = usecaseFactory.createListUserSchedulesUseCase()
            const result = await useCase.execute({ userId, from, to })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },
}
