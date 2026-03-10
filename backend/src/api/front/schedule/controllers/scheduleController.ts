import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const scheduleController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { activityId } = req.params
            const { date, startTime, endTime, location, note, capacity, participationFee } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCreateScheduleUseCase()
            const result = await useCase.execute({
                activityId,
                date,
                startTime,
                endTime,
                location,
                note,
                capacity,
                participationFee,
                userId,
            })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { activityId } = req.params

            const useCase = usecaseFactory.createListSchedulesUseCase()
            const result = await useCase.execute({ activityId })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            const useCase = usecaseFactory.createFindScheduleUseCase()
            const result = await useCase.execute({ scheduleId: id })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const { date, startTime, endTime, location, note, capacity, participationFee } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createUpdateScheduleUseCase()
            await useCase.execute({
                scheduleId: id,
                userId,
                date,
                startTime,
                endTime,
                location,
                note,
                capacity,
                participationFee,
            })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCancelScheduleUseCase()
            await useCase.execute({ scheduleId: id, userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
