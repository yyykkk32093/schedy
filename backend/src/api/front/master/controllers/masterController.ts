import { prisma } from '@/_sharedTech/db/client.js'
import type { NextFunction, Request, Response } from 'express'

export const masterController = {
    async getCommunityTypes(_req: Request, res: Response, next: NextFunction) {
        try {
            const types = await prisma.communityTypeMaster.findMany({
                orderBy: { sortOrder: 'asc' },
                select: { id: true, name: true, nameEn: true, sortOrder: true },
            })
            res.status(200).json({ communityTypes: types })
        } catch (err) {
            next(err)
        }
    },

    async getCategories(_req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await prisma.categoryMaster.findMany({
                orderBy: { sortOrder: 'asc' },
                select: { id: true, name: true, nameEn: true, sortOrder: true },
            })
            res.status(200).json({ categories })
        } catch (err) {
            next(err)
        }
    },

    async getParticipationLevels(_req: Request, res: Response, next: NextFunction) {
        try {
            const levels = await prisma.participationLevelMaster.findMany({
                orderBy: { sortOrder: 'asc' },
                select: { id: true, name: true, nameEn: true, sortOrder: true },
            })
            res.status(200).json({ participationLevels: levels })
        } catch (err) {
            next(err)
        }
    },

    async getAllMasters(_req: Request, res: Response, next: NextFunction) {
        try {
            const [communityTypes, categories, participationLevels] = await Promise.all([
                prisma.communityTypeMaster.findMany({
                    orderBy: { sortOrder: 'asc' },
                    select: { id: true, name: true, nameEn: true, sortOrder: true },
                }),
                prisma.categoryMaster.findMany({
                    orderBy: { sortOrder: 'asc' },
                    select: { id: true, name: true, nameEn: true, sortOrder: true },
                }),
                prisma.participationLevelMaster.findMany({
                    orderBy: { sortOrder: 'asc' },
                    select: { id: true, name: true, nameEn: true, sortOrder: true },
                }),
            ])
            res.status(200).json({ communityTypes, categories, participationLevels })
        } catch (err) {
            next(err)
        }
    },
}
