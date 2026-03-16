import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { expenseController } from '../controllers/expenseController.js'

const router = Router()

// カテゴリ一覧
router.get('/v1/communities/:communityId/expense-categories', authMiddleware, expenseController.listCategories)

// 支出一覧
router.get('/v1/communities/:communityId/expenses', authMiddleware, expenseController.list)

// 支出登録
router.post('/v1/communities/:communityId/expenses', authMiddleware, expenseController.create)

// 支出削除
router.delete('/v1/communities/:communityId/expenses/:expenseId', authMiddleware, expenseController.remove)

// 支出サマリー
router.get('/v1/communities/:communityId/finance/summary', authMiddleware, expenseController.summary)

export default router
