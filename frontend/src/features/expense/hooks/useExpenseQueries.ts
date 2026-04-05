import { expenseApi } from '@/features/expense/api/expenseApi'
import { activityIncomeDetailKeys, expenseCategoryKeys, expenseKeys, financeSummaryKeys, incomeKeys } from '@/shared/lib/queryKeys'
import type { CreateExpenseCategoryRequest, CreateExpenseRequest, UpdateExpenseCategoryRequest } from '@/shared/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/** カテゴリ一覧 */
export function useExpenseCategories(communityId: string) {
    return useQuery({
        queryKey: expenseCategoryKeys.byCommunity(communityId),
        queryFn: () => expenseApi.listCategories(communityId),
        enabled: !!communityId,
    })
}

/** 経費一覧 */
export function useExpenses(communityId: string, dateRange?: { from?: string; to?: string }) {
    return useQuery({
        queryKey: expenseKeys.byCommunity(communityId, dateRange?.from, dateRange?.to),
        queryFn: () => expenseApi.list(communityId, dateRange),
        enabled: !!communityId,
    })
}

/** 収支サマリ */
export function useFinanceSummary(communityId: string, dateRange?: { from?: string; to?: string }) {
    return useQuery({
        queryKey: financeSummaryKeys.byCommunity(communityId, dateRange?.from, dateRange?.to),
        queryFn: () => expenseApi.summary(communityId, dateRange),
        enabled: !!communityId,
    })
}

/** 収入集計 (W3-11) */
export function useIncome(communityId: string, dateRange?: { from?: string; to?: string }) {
    return useQuery({
        queryKey: incomeKeys.byCommunity(communityId, dateRange?.from, dateRange?.to),
        queryFn: () => expenseApi.income(communityId, dateRange),
        enabled: !!communityId,
    })
}

/** ルートコミュニティ用: サブコミュニティ含む収支ツリー */
export function useFinanceSummaryTree(communityId: string, dateRange?: { from?: string; to?: string }, enabled = true) {
    return useQuery({
        queryKey: [...financeSummaryKeys.byCommunity(communityId, dateRange?.from, dateRange?.to), 'tree'],
        queryFn: () => expenseApi.summaryTree(communityId, dateRange),
        enabled: !!communityId && enabled,
    })
}

/** 収入タブ詳細: Activity 別 Schedule 展開（クリック時のみ fetch） */
export function useActivityIncomeDetail(
    communityId: string,
    activityId: string | null,
    dateRange?: { from?: string; to?: string },
) {
    return useQuery({
        queryKey: activityIncomeDetailKeys.byActivity(communityId, activityId ?? '', dateRange?.from, dateRange?.to),
        queryFn: () => expenseApi.activityIncomeDetail(communityId, activityId!, dateRange),
        enabled: !!communityId && !!activityId,
    })
}

/** 経費作成 */
export function useCreateExpense(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateExpenseRequest) => expenseApi.create(communityId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: expenseKeys.byCommunity(communityId) })
            qc.invalidateQueries({ queryKey: financeSummaryKeys.byCommunity(communityId) })
        },
    })
}

/** 経費削除 */
export function useDeleteExpense(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (expenseId: string) => expenseApi.remove(communityId, expenseId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: expenseKeys.byCommunity(communityId) })
            qc.invalidateQueries({ queryKey: financeSummaryKeys.byCommunity(communityId) })
        },
    })
}

// ─── カテゴリ CRUD ──────────────────────────────────────

/** カテゴリ作成 */
export function useCreateExpenseCategory(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateExpenseCategoryRequest) => expenseApi.createCategory(communityId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: expenseCategoryKeys.byCommunity(communityId) })
        },
    })
}

/** カテゴリ更新（リネーム） */
export function useUpdateExpenseCategory(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ categoryId, ...data }: UpdateExpenseCategoryRequest & { categoryId: string }) =>
            expenseApi.updateCategory(communityId, categoryId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: expenseCategoryKeys.byCommunity(communityId) })
            qc.invalidateQueries({ queryKey: expenseKeys.byCommunity(communityId) })
            qc.invalidateQueries({ queryKey: financeSummaryKeys.byCommunity(communityId) })
        },
    })
}

/** カテゴリ無効化（論理削除） */
export function useDeactivateExpenseCategory(communityId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (categoryId: string) => expenseApi.deactivateCategory(communityId, categoryId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: expenseCategoryKeys.byCommunity(communityId) })
            qc.invalidateQueries({ queryKey: expenseKeys.byCommunity(communityId) })
            qc.invalidateQueries({ queryKey: financeSummaryKeys.byCommunity(communityId) })
        },
    })
}
