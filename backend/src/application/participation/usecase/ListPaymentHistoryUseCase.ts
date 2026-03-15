import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import type { PrismaClient } from '@prisma/client'

interface ResolvedPaymentItem {
    paymentId: string
    scheduleId: string
    userId: string
    displayName: string | null
    paymentMethod: string
    amount: number
    feeAmount: number
    status: string // 'REFUNDED' | 'NO_REFUND'
    createdAt: Date
    updatedAt: Date
    // スケジュール・アクティビティ情報
    activityTitle: string | null
    scheduleDate: string | null
    scheduleStartTime: string | null
    paymentNumber: number
}

/**
 * ListPaymentHistoryUseCase — 返金解決済みの Payment 一覧取得
 *
 * コミュニティ単位で REFUNDED / NO_REFUND な Payment を返す。
 * 管理者が返金履歴を確認し、必要に応じて REFUND_PENDING に戻すために使用する。
 */
export class ListPaymentHistoryUseCase {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
        private readonly userRepository: IUserRepository,
        private readonly prisma: PrismaClient,
    ) { }

    async execute(input: { communityId: string }): Promise<{
        payments: ResolvedPaymentItem[]
    }> {
        const payments = await this.paymentRepository.findResolvedByCommunityId(input.communityId)

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
                    status: p.getPaymentStatus().getValue(),
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
