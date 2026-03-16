import type { ExpenseCategory } from '../model/entity/ExpenseCategory.js'

export interface IExpenseCategoryRepository {
    findById(id: string): Promise<ExpenseCategory | null>

    /** システムカテゴリ + コミュニティカスタムカテゴリを取得（アクティブのみ） */
    findsByCommunityId(communityId: string): Promise<ExpenseCategory[]>

    /** システムカテゴリ一覧（全コミュニティ共通） */
    findSystemCategories(): Promise<ExpenseCategory[]>

    add(category: ExpenseCategory): Promise<void>
    update(category: ExpenseCategory): Promise<void>
}
