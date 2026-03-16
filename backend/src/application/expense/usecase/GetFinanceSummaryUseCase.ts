import type { IExpenseCategoryRepository } from '@/domains/expense/domain/repository/IExpenseCategoryRepository.js'
import type { IExpenseRepository } from '@/domains/expense/domain/repository/IExpenseRepository.js'

/**
 * コミュニティの支出サマリーを取得
 * - 支出合計
 * - カテゴリ別支出内訳
 *
 * NOTE: 収入（Payment CONFIRMED合計）は Activity→Schedule→Payment の
 * 横断クエリが必要なため、別途 GetCommunityIncomeUseCase で対応予定
 */
export class GetFinanceSummaryUseCase {
    constructor(
        private readonly expenseRepository: IExpenseRepository,
        private readonly categoryRepository: IExpenseCategoryRepository,
    ) { }

    async execute(input: { communityId: string }): Promise<{
        totalExpense: number
        expensesByCategory: Array<{
            categoryId: string
            categoryName: string
            total: number
        }>
    }> {
        const [expenses, categories, totalExpense] = await Promise.all([
            this.expenseRepository.findsByCommunityId(input.communityId),
            this.categoryRepository.findsByCommunityId(input.communityId),
            this.expenseRepository.sumByCommunityId(input.communityId),
        ])

        const categoryMap = new Map(categories.map((c) => [c.getId(), c.getName()]))

        // カテゴリ別支出集計
        const categoryTotals = new Map<string, number>()
        for (const e of expenses) {
            const current = categoryTotals.get(e.getCategoryId()) ?? 0
            categoryTotals.set(e.getCategoryId(), current + e.getAmount())
        }

        return {
            totalExpense,
            expensesByCategory: Array.from(categoryTotals.entries()).map(([categoryId, total]) => ({
                categoryId,
                categoryName: categoryMap.get(categoryId) ?? '未分類',
                total,
            })),
        }
    }
}
