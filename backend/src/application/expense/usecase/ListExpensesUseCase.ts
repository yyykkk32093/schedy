import type { IExpenseCategoryRepository } from '@/domains/expense/domain/repository/IExpenseCategoryRepository.js';
import type { IExpenseRepository } from '@/domains/expense/domain/repository/IExpenseRepository.js';

export class ListExpensesUseCase {
    constructor(
        private readonly expenseRepository: IExpenseRepository,
        private readonly categoryRepository: IExpenseCategoryRepository,
    ) { }

    async execute(input: { communityId: string; from?: string; to?: string }): Promise<{
        expenses: Array<{
            id: string
            communityId: string
            categoryId: string
            categoryName: string
            amount: number
            description: string | null
            date: string
            createdBy: string
            createdAt: string
        }>
    }> {
        const dateRange = (input.from || input.to)
            ? {
                from: input.from ? new Date(input.from) : undefined,
                to: input.to ? new Date(input.to) : undefined,
            }
            : undefined

        const [expenses, categories] = await Promise.all([
            this.expenseRepository.findsByCommunityId(input.communityId, dateRange),
            this.categoryRepository.findsByCommunityId(input.communityId),
        ])

        const categoryMap = new Map(categories.map((c) => [c.getId(), c.getName()]))

        return {
            expenses: expenses.map((e) => ({
                id: e.getId(),
                communityId: e.getCommunityId(),
                categoryId: e.getCategoryId(),
                categoryName: categoryMap.get(e.getCategoryId()) ?? '未分類',
                amount: e.getAmount(),
                description: e.getDescription(),
                date: e.getDate().toISOString().split('T')[0],
                createdBy: e.getCreatedBy(),
                createdAt: e.getCreatedAt().toISOString(),
            })),
        }
    }
}
