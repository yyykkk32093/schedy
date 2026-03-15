import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import { PaymentMethod } from '../valueObject/PaymentMethod.js'
import { PaymentStatus } from '../valueObject/PaymentStatus.js'

/**
 * Payment — 決済エンティティ
 *
 * Participation（参加）とは独立したライフサイクルを持つ。
 * キャンセル後も Payment レコードは残り、返金ステータスを追跡できる。
 */
export class Payment extends AggregateRoot {
    private constructor(
        private readonly id: string,
        private readonly scheduleId: ScheduleId,
        private readonly userId: UserId,
        private readonly paymentMethod: PaymentMethod,
        private readonly amount: number,
        private readonly feeAmount: number,
        private paymentStatus: PaymentStatus,
        private stripePaymentIntentId: string | null,
        private paymentReportedAt: Date | null,
        private paymentConfirmedAt: Date | null,
        private paymentConfirmedBy: string | null,
        private readonly createdAt: Date,
        private updatedAt: Date,
    ) {
        super()
    }

    static create(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        paymentMethod: PaymentMethod
        amount: number
        feeAmount?: number
    }): Payment {
        return new Payment(
            params.id,
            params.scheduleId,
            params.userId,
            params.paymentMethod,
            params.amount,
            params.feeAmount ?? 0,
            PaymentStatus.unpaid(),
            null,
            null,
            null,
            null,
            new Date(),
            new Date(),
        )
    }

    static reconstruct(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        paymentMethod: PaymentMethod
        amount: number
        feeAmount: number
        paymentStatus: PaymentStatus
        stripePaymentIntentId: string | null
        paymentReportedAt: Date | null
        paymentConfirmedAt: Date | null
        paymentConfirmedBy: string | null
        createdAt: Date
        updatedAt: Date
    }): Payment {
        return new Payment(
            params.id,
            params.scheduleId,
            params.userId,
            params.paymentMethod,
            params.amount,
            params.feeAmount,
            params.paymentStatus,
            params.stripePaymentIntentId,
            params.paymentReportedAt,
            params.paymentConfirmedAt,
            params.paymentConfirmedBy,
            params.createdAt,
            params.updatedAt,
        )
    }

    // ── Domain Operations ─────────────────────────────────

    reportPayment(): void {
        if (this.paymentStatus.isConfirmed()) {
            throw new DomainValidationError('すでに支払確認済みです', 'PAYMENT_ALREADY_CONFIRMED')
        }
        this.paymentStatus = PaymentStatus.reported()
        this.paymentReportedAt = new Date()
        this.updatedAt = new Date()
    }

    confirmPayment(confirmedBy: string): void {
        if (!this.paymentStatus.isReported()) {
            throw new DomainValidationError('支払報告がされていません', 'PAYMENT_NOT_REPORTED')
        }
        this.paymentStatus = PaymentStatus.confirmed()
        this.paymentConfirmedAt = new Date()
        this.paymentConfirmedBy = confirmedBy
        this.updatedAt = new Date()
    }

    rejectPayment(): void {
        this.paymentStatus = PaymentStatus.rejected()
        this.updatedAt = new Date()
    }

    markPaymentConfirmedByStripe(): void {
        this.paymentStatus = PaymentStatus.confirmed()
        this.paymentConfirmedAt = new Date()
        this.updatedAt = new Date()
    }

    markRefundPending(): void {
        this.paymentStatus = PaymentStatus.refundPending()
        this.updatedAt = new Date()
    }

    markRefunded(): void {
        if (!this.paymentStatus.isRefundPending()) {
            throw new DomainValidationError('返金待ち状態ではありません', 'PAYMENT_NOT_REFUND_PENDING')
        }
        this.paymentStatus = PaymentStatus.refunded()
        this.updatedAt = new Date()
    }

    /** REFUND_PENDING → NO_REFUND（返金不要と判断） */
    markNoRefund(): void {
        if (!this.paymentStatus.isRefundPending()) {
            throw new DomainValidationError('返金待ち状態ではありません', 'PAYMENT_NOT_REFUND_PENDING')
        }
        this.paymentStatus = PaymentStatus.noRefund()
        this.updatedAt = new Date()
    }

    /** REFUNDED / NO_REFUND → REFUND_PENDING に巻き戻す */
    revertToRefundPending(): void {
        if (!this.paymentStatus.isRefunded() && !this.paymentStatus.isNoRefund()) {
            throw new DomainValidationError('返金済みまたは返金不要状態ではありません', 'PAYMENT_NOT_REFUND_TERMINAL')
        }
        this.paymentStatus = PaymentStatus.refundPending()
        this.updatedAt = new Date()
    }

    setStripePaymentIntentId(paymentIntentId: string): void {
        this.stripePaymentIntentId = paymentIntentId
        this.updatedAt = new Date()
    }

    isStripePaid(): boolean {
        return (
            this.paymentMethod.isStripe() &&
            this.paymentStatus.isPaid() &&
            this.stripePaymentIntentId != null
        )
    }

    // ── Getters ───────────────────────────────────────────

    getId(): string { return this.id }
    getScheduleId(): ScheduleId { return this.scheduleId }
    getUserId(): UserId { return this.userId }
    getPaymentMethod(): PaymentMethod { return this.paymentMethod }
    getAmount(): number { return this.amount }
    getFeeAmount(): number { return this.feeAmount }
    getPaymentStatus(): PaymentStatus { return this.paymentStatus }
    getStripePaymentIntentId(): string | null { return this.stripePaymentIntentId }
    getPaymentReportedAt(): Date | null { return this.paymentReportedAt }
    getPaymentConfirmedAt(): Date | null { return this.paymentConfirmedAt }
    getPaymentConfirmedBy(): string | null { return this.paymentConfirmedBy }
    getCreatedAt(): Date { return this.createdAt }
    getUpdatedAt(): Date { return this.updatedAt }
}
