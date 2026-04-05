import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'

/**
 * W3-11: コミュニティ収入集計 UseCase (D-1:B)
 *
 * CONFIRMED 状態の Payment を集計し、コミュニティの総収入とアクティビティ別の内訳を返す。
 * GetFinanceSummaryUseCase とは SRP で分離。
 */
export class GetCommunityIncomeUseCase {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
        private readonly activityRepository: IActivityRepository,
    ) { }

    async execute(input: {
        communityId: string
        from?: string
        to?: string
    }): Promise<{
        totalIncome: number
        incomeByActivity: Array<{
            activityId: string
            activityTitle: string
            total: number
        }>
    }> {
        const dateRange = (input.from || input.to)
            ? {
                from: input.from ? new Date(input.from) : undefined,
                to: input.to ? new Date(input.to) : undefined,
            }
            : undefined

        const [aggregated, activities] = await Promise.all([
            this.paymentRepository.aggregateConfirmedIncomeByActivity(input.communityId, dateRange),
            this.activityRepository.findsByCommunityId(input.communityId),
        ])

        const activityMap = new Map(
            activities.map((a) => [a.getId().getValue(), a.getTitle().getValue()]),
        )

        const incomeByActivity = aggregated.map((row) => ({
            activityId: row.activityId,
            activityTitle: activityMap.get(row.activityId) ?? '（削除されたアクティビティ）',
            total: row.total,
        }))

        const totalIncome = incomeByActivity.reduce((sum, item) => sum + item.total, 0)

        return {
            totalIncome,
            incomeByActivity: incomeByActivity.sort((a, b) => b.total - a.total),
        }
    }
}
