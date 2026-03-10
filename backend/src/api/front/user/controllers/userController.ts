import type { NextFunction, Request, Response } from 'express'

import { usecaseFactory } from '@/api/_usecaseFactory.js'

export const userController = {
    async signUp(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, displayName } = (req.body ?? {}) as {
                email?: unknown
                password?: unknown
                displayName?: unknown
            }

            if (typeof email !== 'string' || typeof password !== 'string') {
                return res.status(400).json({ message: 'email and password are required' })
            }

            const result = await usecaseFactory.createSignUpUserUseCase().execute({
                email,
                password,
                displayName:
                    typeof displayName === 'string' || displayName == null
                        ? displayName
                        : undefined,
            })

            return res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    // ---- UBL-32: マイページ ----

    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const useCase = usecaseFactory.createGetUserProfileUseCase()
            const result = await useCase.execute({ userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const { displayName, avatarUrl, biography } = req.body

            const useCase = usecaseFactory.createUpdateUserProfileUseCase()
            await useCase.execute({ userId, displayName, avatarUrl, biography })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
