import type { Payment } from '../model/entity/Payment.js'

export interface IPaymentRepository {
    findById(id: string): Promise<Payment | null>

    /** 指定スケジュール・ユーザーの最新の Payment を取得 */
    findLatestByScheduleAndUser(scheduleId: string, userId: string): Promise<Payment | null>

    /** Stripe PaymentIntentId から Payment を取得（Webhook 用） */
    findByStripePaymentIntentId(paymentIntentId: string): Promise<Payment | null>

    /** 指定スケジュールの全 Payment を取得（参加者一覧表示用） */
    findsByScheduleId(scheduleId: string): Promise<Payment[]>

    /**
     * PayPay 再参加判定用:
     * 未解決の支払い（REPORTED / CONFIRMED / REFUND_PENDING）が存在するか
     */
    existsUnresolvedPayment(
        scheduleId: string,
        userId: string,
        paymentMethod: string,
    ): Promise<boolean>

    /** 返金管理用: 指定スケジュールの REFUND_PENDING な Payment 一覧 */
    findRefundPendingByScheduleId(scheduleId: string): Promise<Payment[]>

    /** 返金管理用: 指定コミュニティ配下の全 REFUND_PENDING な Payment 一覧 */
    findRefundPendingByCommunityId(communityId: string): Promise<Payment[]>

    /** 返金履歴用: 指定コミュニティ配下の REFUNDED / NO_REFUND な Payment 一覧 */
    findResolvedByCommunityId(communityId: string): Promise<Payment[]>

    /** Participation ID から Payment を取得（ビジター支払い管理用） */
    findByParticipationId(participationId: string): Promise<Payment | null>

    /** W3-11: コミュニティ配下の CONFIRMED Payment をアクティビティ別に集計。dateRange は Schedule.date で絞り込み (D-3:A) */
    aggregateConfirmedIncomeByActivity(communityId: string, dateRange?: { from?: Date; to?: Date }): Promise<Array<{
        activityId: string
        total: number
    }>>

    /** 収入タブ詳細: 指定 Activity の CONFIRMED Payment を個別取得（Schedule 別展開用） */
    getConfirmedPaymentsByActivity(activityId: string, dateRange?: { from?: Date; to?: Date }): Promise<Array<{
        scheduleId: string
        scheduleDate: Date
        scheduleStartTime: string
        displayName: string | null
        amount: number
        userId: string | null
        isVisitor: boolean
    }>>

    add(payment: Payment): Promise<void>
    update(payment: Payment): Promise<void>
}
