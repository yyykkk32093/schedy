import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { IExpenseRepository } from '@/domains/expense/domain/repository/IExpenseRepository.js'

/**
 * ルートコミュニティ用: 自コミュニティ + 全サブコミュニティの収支サマリーをツリー形式で返す
 *
 * レスポンス:
 *   communities: 各コミュニティ（自分 + 子）の収支
 *   totals: 全体合計
 */
export class GetFinanceSummaryTreeUseCase {
    constructor(
        private readonly communityRepository: ICommunityRepository,
        private readonly expenseRepository: IExpenseRepository,
        private readonly paymentRepository: IPaymentRepository,
        private readonly activityRepository: IActivityRepository,
    ) { }

    async execute(input: {
        communityId: string
        from?: string
        to?: string
    }): Promise<{
        communities: Array<{
            communityId: string
            communityName: string
            income: number
            expense: number
            balance: number
        }>
        totals: {
            income: number
            expense: number
            balance: number
        }
    }> {
        const dateRange =
            input.from || input.to
                ? {
                    from: input.from ? new Date(input.from) : undefined,
                    to: input.to ? new Date(input.to) : undefined,
                }
                : undefined

        // ルートコミュニティ + 子コミュニティの ID を取得
        const community = await this.communityRepository.findById(input.communityId)
        if (!community) {
            return { communities: [], totals: { income: 0, expense: 0, balance: 0 } }
        }
        const childrenIds = await this.communityRepository.findChildrenIds(input.communityId)
        const allIds = [input.communityId, ...childrenIds]

        // 各コミュニティ名を取得
        const nameMap = new Map<string, string>()
        nameMap.set(input.communityId, community.getName().getValue())
        if (childrenIds.length > 0) {
            for (const cid of childrenIds) {
                const child = await this.communityRepository.findById(cid)
                if (child) nameMap.set(cid, child.getName().getValue())
            }
        }

        // 各コミュニティの収支を並列取得
        const results = await Promise.all(
            allIds.map(async (cid) => {
                const [totalExpense, incomeAgg] = await Promise.all([
                    this.expenseRepository.sumByCommunityId(cid, dateRange),
                    this.paymentRepository.aggregateConfirmedIncomeByActivity(cid, dateRange),
                ])
                const income = incomeAgg.reduce((sum, row) => sum + row.total, 0)
                return {
                    communityId: cid,
                    communityName: nameMap.get(cid) ?? cid,
                    income,
                    expense: totalExpense,
                    balance: income - totalExpense,
                }
            }),
        )

        const totals = results.reduce(
            (acc, r) => ({
                income: acc.income + r.income,
                expense: acc.expense + r.expense,
                balance: acc.balance + r.balance,
            }),
            { income: 0, expense: 0, balance: 0 },
        )

        return { communities: results, totals }
    }
}
