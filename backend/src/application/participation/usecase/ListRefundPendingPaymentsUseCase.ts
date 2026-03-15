import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import type { PrismaClient } from '@prisma/client'

interface RefundPendingPaymentItem {
    paymentId: string
    scheduleId: string
    userId: string
    displayName: string | null
    paymentMethod: string
    amount: number
    feeAmount: number
    createdAt: Date
    updatedAt: Date
    // スケジュール・アクティビティ情報
    activityTitle: string | null
    scheduleDate: string | null
    scheduleStartTime: string | null
    paymentNumber: number // 何回目の支払いか
}

/**
 * ListRefundPendingPaymentsUseCase — 返金待ちの Payment 一覧取得
 *
 * スケジュール単位 or コミュニティ単位で REFUND_PENDING な Payment を返す。
 * 管理者が返金対象を一覧確認するために使用する。
 */
export class ListRefundPendingPaymentsUseCase {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
        private readonly userRepository: IUserRepository,
        private readonly prisma: PrismaClient,
    ) { }

    async execute(input: { scheduleId?: string; communityId?: string }): Promise<{
        payments: RefundPendingPaymentItem[]
    }> {
        let payments
        if (input.scheduleId) {
            payments = await this.paymentRepository.findRefundPendingByScheduleId(input.scheduleId)
        } else if (input.communityId) {
            payments = await this.paymentRepository.findRefundPendingByCommunityId(input.communityId)
        } else {
            return { payments: [] }
        }

        // ユーザー表示名を取得
        const userIds = [...new Set(payments.map((p) => p.getUserId().getValue()))]
        const users = userIds.length > 0
            ? await this.userRepository.findByIds(userIds) : []
        const userMap = new Map(
            users.map((u) => [u.getId().getValue(), u.getDisplayName()?.getValue() ?? null])
        )

        // スケジュール・アクティビティ情報を取得
        const scheduleIds = [...new Set(payments.map((p) => p.getScheduleId().getValue()))]
        const scheduleInfoMap = new Map<string, { activityTitle: string; date: Date; startTime: string }>()
        if (scheduleIds.length > 0) {
            const schedules = await this.prisma.schedule.findMany({
                where: { id: { in: scheduleIds } },
                include: { activity: { select: { title: true } } },
            })
            for (const s of schedules) {
                scheduleInfoMap.set(s.id, { activityTitle: s.activity.title, date: s.date, startTime: s.startTime })
            }
        }

        // 同一 (scheduleId, userId) での支払い順序を取得
        const pairOrderMap = new Map<string, string[]>()
        if (payments.length > 0) {
            const seen = new Set<string>()
            for (const p of payments) {
                const key = `${p.getScheduleId().getValue()}:${p.getUserId().getValue()}`
                if (!seen.has(key)) {
                    seen.add(key)
                    const ordered = await this.prisma.payment.findMany({
                        where: { scheduleId: p.getScheduleId().getValue(), userId: p.getUserId().getValue() },
                        orderBy: { createdAt: 'asc' },
                        select: { id: true },
                    })
                    pairOrderMap.set(key, ordered.map((r) => r.id))
                }
            }
        }

        return {
            payments: payments.map((p) => {
                const sid = p.getScheduleId().getValue()
                const uid = p.getUserId().getValue()
                const info = scheduleInfoMap.get(sid)
                const orderedIds = pairOrderMap.get(`${sid}:${uid}`) ?? []
                const paymentNumber = orderedIds.indexOf(p.getId()) + 1 || 1
                return {
                    paymentId: p.getId(),
                    scheduleId: sid,
                    userId: uid,
                    displayName: userMap.get(uid) ?? null,
                    paymentMethod: p.getPaymentMethod().getValue(),
                    amount: p.getAmount(),
                    feeAmount: p.getFeeAmount(),
                    createdAt: p.getCreatedAt(),
                    updatedAt: p.getUpdatedAt(),
                    activityTitle: info?.activityTitle ?? null,
                    scheduleDate: info?.date.toISOString().slice(0, 10) ?? null,
                    scheduleStartTime: info?.startTime ?? null,
                    paymentNumber,
                }
            }),
        }
    }
}
