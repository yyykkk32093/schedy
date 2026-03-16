import type { Expense } from '../model/entity/Expense.js'

export interface IExpenseRepository {
    findById(id: string): Promise<Expense | null>

    /** コミュニティの支出一覧（日付降順） */
    findsByCommunityId(communityId: string): Promise<Expense[]>

    /** コミュニティの支出合計 */
    sumByCommunityId(communityId: string): Promise<number>

    add(expense: Expense): Promise<void>
    update(expense: Expense): Promise<void>
    delete(id: string): Promise<void>
}
