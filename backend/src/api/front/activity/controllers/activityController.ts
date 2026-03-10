import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const activityController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { title, description, defaultLocation, defaultAddress, defaultStartTime, defaultEndTime, recurrenceRule, date, participationFee, organizerUserId, isOnline, meetingUrl, capacity } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCreateActivityUseCase()
            const result = await useCase.execute({
                communityId,
                title,
                description,
                defaultLocation,
                defaultAddress,
                defaultStartTime,
                defaultEndTime,
                recurrenceRule,
                date,
                participationFee: participationFee != null ? Number(participationFee) : null,
                organizerUserId: organizerUserId || null,
                isOnline: isOnline ?? false,
                meetingUrl: meetingUrl || null,
                capacity: capacity != null ? Number(capacity) : null,
                userId,
            })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params

            const useCase = usecaseFactory.createListActivitiesUseCase()
            const result = await useCase.execute({ communityId })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            const useCase = usecaseFactory.createFindActivityUseCase()
            const result = await useCase.execute({ activityId: id })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const { title, description, defaultLocation, defaultAddress, defaultStartTime, defaultEndTime, recurrenceRule, organizerUserId } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createUpdateActivityUseCase()
            await useCase.execute({
                activityId: id,
                userId,
                title,
                description,
                defaultLocation,
                defaultAddress,
                defaultStartTime,
                defaultEndTime,
                recurrenceRule,
                organizerUserId: organizerUserId !== undefined ? (organizerUserId || null) : undefined,
            })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async softDelete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createSoftDeleteActivityUseCase()
            await useCase.execute({ activityId: id, userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async changeOrganizer(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const { organizerUserId } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createUpdateActivityUseCase()
            await useCase.execute({
                activityId: id,
                userId,
                organizerUserId: organizerUserId || null,
            })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
