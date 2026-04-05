import { http } from '@/shared/lib/apiClient';
import type {
    ActivityIncomeDetailResponse,
    CommunityIncomeResponse,
    CreateExpenseCategoryRequest,
    CreateExpenseRequest,
    ExpenseItem,
    FinanceSummaryResponse,
    FinanceSummaryTreeResponse,
    ListExpenseCategoriesResponse,
    ListExpensesResponse,
    UpdateExpenseCategoryRequest,
} from '@/shared/types/api';

export const expenseApi = {
    /** カテゴリ一覧 */
    listCategories: (communityId: string) =>
        http<ListExpenseCategoriesResponse>(`/v1/communities/${communityId}/expense-categories`),

    /** カテゴリ作成 */
    createCategory: (communityId: string, data: CreateExpenseCategoryRequest) =>
        http<{ categoryId: string }>(`/v1/communities/${communityId}/expense-categories`, { method: 'POST', json: data }),

    /** カテゴリ更新（リネーム） */
    updateCategory: (communityId: string, categoryId: string, data: UpdateExpenseCategoryRequest) =>
        http<void>(`/v1/communities/${communityId}/expense-categories/${categoryId}`, { method: 'PATCH', json: data }),

    /** カテゴリ無効化（論理削除） */
    deactivateCategory: (communityId: string, categoryId: string) =>
        http<void>(`/v1/communities/${communityId}/expense-categories/${categoryId}`, { method: 'DELETE' }),

    /** 経費一覧 */
    list: (communityId: string, params?: { from?: string; to?: string }) => {
        const qs = new URLSearchParams()
        if (params?.from) qs.set('from', params.from)
        if (params?.to) qs.set('to', params.to)
        const query = qs.toString()
        return http<ListExpensesResponse>(`/v1/communities/${communityId}/expenses${query ? `?${query}` : ''}`)
    },

    /** 経費作成 */
    create: (communityId: string, data: CreateExpenseRequest) =>
        http<ExpenseItem>(`/v1/communities/${communityId}/expenses`, { method: 'POST', json: data }),

    /** 経費削除 */
    remove: (communityId: string, expenseId: string) =>
        http<void>(`/v1/communities/${communityId}/expenses/${expenseId}`, { method: 'DELETE' }),

    /** 収支サマリ */
    summary: (communityId: string, params?: { from?: string; to?: string }) => {
        const qs = new URLSearchParams()
        if (params?.from) qs.set('from', params.from)
        if (params?.to) qs.set('to', params.to)
        const query = qs.toString()
        return http<FinanceSummaryResponse>(`/v1/communities/${communityId}/finance/summary${query ? `?${query}` : ''}`)
    },

    /** ルートコミュニティ用: サブコミュニティ含む収支ツリー */
    summaryTree: (communityId: string, params?: { from?: string; to?: string }) => {
        const qs = new URLSearchParams()
        if (params?.from) qs.set('from', params.from)
        if (params?.to) qs.set('to', params.to)
        const query = qs.toString()
        return http<FinanceSummaryTreeResponse>(`/v1/communities/${communityId}/finance/summary-tree${query ? `?${query}` : ''}`)
    },

    /** 収入集計 (W3-11) */
    income: (communityId: string, params?: { from?: string; to?: string }) => {
        const qs = new URLSearchParams()
        if (params?.from) qs.set('from', params.from)
        if (params?.to) qs.set('to', params.to)
        const query = qs.toString()
        return http<CommunityIncomeResponse>(`/v1/communities/${communityId}/finance/income${query ? `?${query}` : ''}`)
    },

    /** 収入タブ詳細: Activity 別 Schedule 展開 */
    activityIncomeDetail: (communityId: string, activityId: string, params?: { from?: string; to?: string }) => {
        const qs = new URLSearchParams()
        if (params?.from) qs.set('from', params.from)
        if (params?.to) qs.set('to', params.to)
        const query = qs.toString()
        return http<ActivityIncomeDetailResponse>(`/v1/communities/${communityId}/finance/income/activities/${activityId}${query ? `?${query}` : ''}`)
    },
}
