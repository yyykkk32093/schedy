import { expenseApi } from '@/features/expense/api/expenseApi'
import { expenseCategoryKeys, expenseKeys, financeSummaryKeys } from '@/shared/lib/queryKeys'
import type { CreateExpenseRequest } from '@/shared/types/api'
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
export function useExpenses(communityId: string) {
    return useQuery({
        queryKey: expenseKeys.byCommunity(communityId),
        queryFn: () => expenseApi.list(communityId),
        enabled: !!communityId,
    })
}

/** 収支サマリ */
export function useFinanceSummary(communityId: string) {
    return useQuery({
        queryKey: financeSummaryKeys.byCommunity(communityId),
        queryFn: () => expenseApi.summary(communityId),
        enabled: !!communityId,
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
