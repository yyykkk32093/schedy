import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import { createExpenseCategorySchema, createExpenseSchema } from '@/api/schemas/index.js'
import { Router } from 'express'
import { expenseController } from '../controllers/expenseController.js'

const router = Router()

// カテゴリ一覧
router.get('/v1/communities/:communityId/expense-categories', authMiddleware, expenseController.listCategories)

// カテゴリ作成
router.post('/v1/communities/:communityId/expense-categories', authMiddleware, validateBody(createExpenseCategorySchema), expenseController.createCategory)

// カテゴリ更新（リネーム）
router.patch('/v1/communities/:communityId/expense-categories/:categoryId', authMiddleware, expenseController.updateCategory)

// カテゴリ無効化（論理削除）
router.delete('/v1/communities/:communityId/expense-categories/:categoryId', authMiddleware, expenseController.deactivateCategory)

// 支出一覧
router.get('/v1/communities/:communityId/expenses', authMiddleware, expenseController.list)

// 支出登録
router.post('/v1/communities/:communityId/expenses', authMiddleware, validateBody(createExpenseSchema), expenseController.create)

// 支出削除
router.delete('/v1/communities/:communityId/expenses/:expenseId', authMiddleware, expenseController.remove)

// 支出サマリー
router.get('/v1/communities/:communityId/finance/summary', authMiddleware, expenseController.summary)

// ルートコミュニティ用: サブコミュニティ含む収支ツリー
router.get('/v1/communities/:communityId/finance/summary-tree', authMiddleware, expenseController.summaryTree)

// W3-11: 収入集計
router.get('/v1/communities/:communityId/finance/income', authMiddleware, expenseController.income)

// 収入タブ詳細: Activity 別 Schedule 展開
router.get('/v1/communities/:communityId/finance/income/activities/:activityId', authMiddleware, expenseController.activityIncomeDetail)

export default router
