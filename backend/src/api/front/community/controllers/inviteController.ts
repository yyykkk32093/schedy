import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const inviteController = {
    async generateToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: communityId } = req.params
            const userId = req.user!.userId
            const { expiresInDays } = req.body

            const useCase = usecaseFactory.createGenerateInviteTokenUseCase()
            const result = await useCase.execute({ communityId, userId, expiresInDays })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async acceptInvite(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createAcceptInviteUseCase()
            const result = await useCase.execute({ token, userId })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },
}
