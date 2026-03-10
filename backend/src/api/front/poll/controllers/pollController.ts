import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const pollController = {
    /** 投票作成 */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { question, isMultipleChoice, deadline, options, announcementId } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCreatePollUseCase()
            const result = await useCase.execute({
                communityId,
                announcementId: announcementId ?? null,
                question,
                isMultipleChoice: isMultipleChoice ?? false,
                deadline: deadline ?? null,
                options,
                userId,
            })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 投票結果取得 */
    async getResult(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createGetPollResultUseCase()
            const result = await useCase.execute({ pollId: id, userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** コミュニティの投票一覧 */
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createListPollsUseCase()
            const result = await useCase.execute({ communityId, userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 投票実行 */
    async vote(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const { optionIds } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCastVoteUseCase()
            const result = await useCase.execute({ pollId: id, optionIds, userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 投票削除 */
    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createDeletePollUseCase()
            await useCase.execute({ pollId: id, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
