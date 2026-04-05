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

    /** カテゴリ作成 */
    async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { name } = req.body
            const userId = req.user!.userId

            if (!name || typeof name !== 'string' || name.trim() === '') {
                res.status(400).json({ code: 'INVALID_NAME', message: 'カテゴリ名は必須です' })
                return
            }

            const useCase = usecaseFactory.createCreateExpenseCategoryUseCase()
            const result = await useCase.execute({ communityId, name, userId })
            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** カテゴリ更新（リネーム） */
    async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId, categoryId } = req.params
            const { name } = req.body
            const userId = req.user!.userId

            if (!name || typeof name !== 'string' || name.trim() === '') {
                res.status(400).json({ code: 'INVALID_NAME', message: 'カテゴリ名は必須です' })
                return
            }

            const useCase = usecaseFactory.createUpdateExpenseCategoryUseCase()
            await useCase.execute({ categoryId, communityId, name, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** カテゴリ無効化（論理削除 + 支出振替） */
    async deactivateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId, categoryId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createDeactivateExpenseCategoryUseCase()
            await useCase.execute({ categoryId, communityId, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** 支出一覧 */
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const from = typeof req.query.from === 'string' ? req.query.from : undefined
            const to = typeof req.query.to === 'string' ? req.query.to : undefined

            const useCase = usecaseFactory.createListExpensesUseCase()
            const result = await useCase.execute({ communityId, from, to })
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
            const from = typeof req.query.from === 'string' ? req.query.from : undefined
            const to = typeof req.query.to === 'string' ? req.query.to : undefined

            const useCase = usecaseFactory.createGetFinanceSummaryUseCase()
            const result = await useCase.execute({ communityId, from, to })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** ルートコミュニティ用: サブコミュニティ含む収支ツリー */
    async summaryTree(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const from = typeof req.query.from === 'string' ? req.query.from : undefined
            const to = typeof req.query.to === 'string' ? req.query.to : undefined

            const useCase = usecaseFactory.createGetFinanceSummaryTreeUseCase()
            const result = await useCase.execute({ communityId, from, to })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** W3-11: 収入集計 */
    async income(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const from = typeof req.query.from === 'string' ? req.query.from : undefined
            const to = typeof req.query.to === 'string' ? req.query.to : undefined

            const useCase = usecaseFactory.createGetCommunityIncomeUseCase()
            const result = await useCase.execute({ communityId, from, to })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 収入タブ詳細: Activity 別 Schedule 展開 */
    async activityIncomeDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const { activityId } = req.params
            const from = typeof req.query.from === 'string' ? req.query.from : undefined
            const to = typeof req.query.to === 'string' ? req.query.to : undefined

            const useCase = usecaseFactory.createGetActivityIncomeDetailUseCase()
            const result = await useCase.execute({ activityId, from, to })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },
}
