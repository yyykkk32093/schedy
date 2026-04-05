import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'

/**
 * 収入タブ詳細: 指定 Activity の CONFIRMED Payment を Schedule 別にネストして返す。
 *
 * Activity 行クリック時に遅延取得（lazy fetch）される。
 * isVisitor は Participation INNER JOIN で取得（CONFIRMED なら Participation は必ず存在）。
 */
export class GetActivityIncomeDetailUseCase {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(input: {
        activityId: string
        from?: string
        to?: string
    }): Promise<{
        schedules: Array<{
            scheduleId: string
            label: string
            total: number
            payments: Array<{
                displayName: string | null
                amount: number
                isVisitor: boolean
                isGuest: boolean
            }>
        }>
    }> {
        const dateRange = (input.from || input.to)
            ? {
                from: input.from ? new Date(input.from) : undefined,
                to: input.to ? new Date(input.to) : undefined,
            }
            : undefined

        const rows = await this.paymentRepository.getConfirmedPaymentsByActivity(
            input.activityId,
            dateRange,
        )

        // フラット行を Schedule 別にグループ化
        const scheduleMap = new Map<string, {
            scheduleId: string
            label: string
            total: number
            payments: Array<{
                displayName: string | null
                amount: number
                isVisitor: boolean
                isGuest: boolean
            }>
        }>()

        for (const row of rows) {
            let entry = scheduleMap.get(row.scheduleId)
            if (!entry) {
                const d = new Date(row.scheduleDate)
                const label = `${d.getMonth() + 1}/${d.getDate()} ${row.scheduleStartTime}`
                entry = {
                    scheduleId: row.scheduleId,
                    label,
                    total: 0,
                    payments: [],
                }
                scheduleMap.set(row.scheduleId, entry)
            }

            entry.total += row.amount
            entry.payments.push({
                displayName: row.displayName,
                amount: row.amount,
                isVisitor: row.isVisitor,
                isGuest: row.isVisitor && row.userId === null,
            })
        }

        // 日付降順（新しいスケジュールが上）
        const schedules = Array.from(scheduleMap.values())

        return { schedules }
    }
}
