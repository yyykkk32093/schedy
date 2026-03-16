import { http } from '@/shared/lib/apiClient'
import type {
    CreateExpenseRequest,
    ExpenseItem,
    FinanceSummaryResponse,
    ListExpenseCategoriesResponse,
    ListExpensesResponse,
} from '@/shared/types/api'

export const expenseApi = {
    /** カテゴリ一覧 */
    listCategories: (communityId: string) =>
        http<ListExpenseCategoriesResponse>(`/v1/communities/${communityId}/expense-categories`),

    /** 経費一覧 */
    list: (communityId: string) =>
        http<ListExpensesResponse>(`/v1/communities/${communityId}/expenses`),

    /** 経費作成 */
    create: (communityId: string, data: CreateExpenseRequest) =>
        http<ExpenseItem>(`/v1/communities/${communityId}/expenses`, { method: 'POST', json: data }),

    /** 経費削除 */
    remove: (communityId: string, expenseId: string) =>
        http<void>(`/v1/communities/${communityId}/expenses/${expenseId}`, { method: 'DELETE' }),

    /** 収支サマリ */
    summary: (communityId: string) =>
        http<FinanceSummaryResponse>(`/v1/communities/${communityId}/finance/summary`),
}
