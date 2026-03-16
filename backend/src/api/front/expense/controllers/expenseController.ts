import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const expenseController = {
    /** 支出カテゴリ一覧 */
    async listCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const useCase = usecaseFactory.createListExpenseCategoriesUseCase()
            const result = await useCase.execute({ communityId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 支出一覧 */
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const useCase = usecaseFactory.createListExpensesUseCase()
            const result = await useCase.execute({ communityId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 支出登録 */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { categoryId, amount, description, date } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCreateExpenseUseCase()
            const result = await useCase.execute({
                communityId,
                categoryId,
                amount,
                description,
                date,
                userId,
            })
            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 支出削除 */
    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId, expenseId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createDeleteExpenseUseCase()
            await useCase.execute({ expenseId, communityId, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** 支出サマリー */
    async summary(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const useCase = usecaseFactory.createGetFinanceSummaryUseCase()
            const result = await useCase.execute({ communityId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },
}
