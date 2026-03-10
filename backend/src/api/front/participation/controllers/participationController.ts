import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const participationController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const useCase = usecaseFactory.createListParticipationsUseCase()
            const result = await useCase.execute({ scheduleId })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    async attend(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const { isVisitor, paymentMethod } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createAttendScheduleUseCase()
            const result = await useCase.execute({ scheduleId, userId, isVisitor, paymentMethod })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCancelParticipationUseCase()
            await useCase.execute({ scheduleId, userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async joinWaitlist(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createJoinWaitlistUseCase()
            const result = await useCase.execute({ scheduleId, userId })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async cancelWaitlist(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCancelWaitlistUseCase()
            await useCase.execute({ scheduleId, userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** UBL-8: 支払報告 */
    async reportPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const { participationId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createReportPaymentUseCase()
            await useCase.execute({ participationId, userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** UBL-8: 支払確認（管理者） */
    async confirmPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const { participationId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createConfirmPaymentUseCase()
            await useCase.execute({ participationId, confirmedBy: userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
