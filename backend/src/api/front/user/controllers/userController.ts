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
}
