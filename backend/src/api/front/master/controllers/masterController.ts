import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const masterController = {
    async getCategories(_req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await usecaseFactory.createMasterRepository().findCategories()
            res.status(200).json({ categories })
        } catch (err) {
            next(err)
        }
    },

    async getParticipationLevels(_req: Request, res: Response, next: NextFunction) {
        try {
            const levels = await usecaseFactory.createMasterRepository().findParticipationLevels()
            res.status(200).json({ participationLevels: levels })
        } catch (err) {
            next(err)
        }
    },

    async getAllMasters(_req: Request, res: Response, next: NextFunction) {
        try {
            const masterRepo = usecaseFactory.createMasterRepository()
            const [categories, participationLevels] = await Promise.all([
                masterRepo.findCategories(),
                masterRepo.findParticipationLevels(),
            ])
            res.status(200).json({ categories, participationLevels })
        } catch (err) {
            next(err)
        }
    },
}
