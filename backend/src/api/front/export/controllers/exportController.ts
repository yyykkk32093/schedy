import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * exportController — データ出力 API コントローラ（UBL-20〜22）
 */
export const exportController = {
    /** UBL-20: 参加状況 CSV 出力 */
    async participationCsv(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { activityId, from, to } = req.query as {
                activityId?: string
                from?: string
                to?: string
            }

            const useCase = usecaseFactory.createExportParticipationCsvUseCase()
            const csv = await useCase.execute({ communityId, activityId, from, to })

            const filename = `participation_${communityId}_${new Date().toISOString().slice(0, 10)}.csv`
            res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.send(csv)
        } catch (err) {
            next(err)
        }
    },

    /** UBL-21: 会計情報出力 */
    async accounting(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { format = 'csv', from, to } = req.query as {
                format?: 'csv' | 'pdf'
                from?: string
                to?: string
            }

            const useCase = usecaseFactory.createExportAccountingUseCase()
            const result = await useCase.execute({ communityId, from, to, format })

            if (result.format === 'csv') {
                res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            } else {
                res.setHeader('Content-Type', 'application/pdf')
            }
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${result.filename}"`,
            )
            res.send(result.data)
        } catch (err) {
            next(err)
        }
    },

    /** UBL-22: カレンダーエクスポート（iCal） */
    async calendarIcal(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const { from, to } = req.query as { from?: string; to?: string }

            const useCase = usecaseFactory.createExportCalendarUseCase()
            const ical = await useCase.execute({ userId, from, to })

            res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="schedy-calendar.ics"',
            )
            res.send(ical)
        } catch (err) {
            next(err)
        }
    },
}
