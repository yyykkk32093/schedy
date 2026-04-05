import type { Expense } from '../model/entity/Expense.js';

export interface IExpenseRepository {
    findById(id: string): Promise<Expense | null>

    /** コミュニティの支出一覧（日付降順）。dateRange 指定時は expenseDate でフィルタ */
    findsByCommunityId(communityId: string, dateRange?: { from?: Date; to?: Date }): Promise<Expense[]>

    /** コミュニティの支出合計。dateRange 指定時は expenseDate でフィルタ */
    sumByCommunityId(communityId: string, dateRange?: { from?: Date; to?: Date }): Promise<number>

    add(expense: Expense): Promise<void>
    update(expense: Expense): Promise<void>
    delete(id: string): Promise<void>

    /** カテゴリ一括振替（fromCategoryId → toCategoryId） */
    reassignCategory(fromCategoryId: string, toCategoryId: string): Promise<void>
}
