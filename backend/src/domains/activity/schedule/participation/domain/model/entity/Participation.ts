import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import { ParticipationStatus } from '../valueObject/ParticipationStatus.js'
import { PaymentMethod } from '../valueObject/PaymentMethod.js'
import { PaymentStatus } from '../valueObject/PaymentStatus.js'

/**
 * Participation: Schedule への参加表明。
 * - status: ATTENDING | CANCELLED
 * - レコード不在 = 未回答
 * - UBL-8: paymentMethod / paymentStatus で支払管理
 */
export class Participation extends AggregateRoot {
    private constructor(
        private readonly id: string,
        private readonly scheduleId: ScheduleId,
        private readonly userId: UserId,
        private status: ParticipationStatus,
        private readonly isVisitor: boolean,
        private readonly respondedAt: Date,
        private cancelledAt: Date | null,
        private paymentMethod: PaymentMethod | null,
        private paymentStatus: PaymentStatus | null,
        private paymentReportedAt: Date | null,
        private paymentConfirmedAt: Date | null,
        private paymentConfirmedBy: string | null,
    ) {
        super()
    }

    static create(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        isVisitor?: boolean
        paymentMethod?: PaymentMethod | null
    }): Participation {
        const hasPayment = params.paymentMethod != null
        return new Participation(
            params.id,
            params.scheduleId,
            params.userId,
            ParticipationStatus.attending(),
            params.isVisitor ?? false,
            new Date(),
            null,
            params.paymentMethod ?? null,
            hasPayment ? PaymentStatus.unpaid() : null,
            null,
            null,
            null,
        )
    }

    static reconstruct(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        status: ParticipationStatus
        isVisitor: boolean
        respondedAt: Date
        cancelledAt: Date | null
        paymentMethod: PaymentMethod | null
        paymentStatus: PaymentStatus | null
        paymentReportedAt: Date | null
        paymentConfirmedAt: Date | null
        paymentConfirmedBy: string | null
    }): Participation {
        return new Participation(
            params.id,
            params.scheduleId,
            params.userId,
            params.status,
            params.isVisitor,
            params.respondedAt,
            params.cancelledAt,
            params.paymentMethod,
            params.paymentStatus,
            params.paymentReportedAt,
            params.paymentConfirmedAt,
            params.paymentConfirmedBy,
        )
    }

    cancel(): void {
        if (this.status.isCancelled()) {
            throw new DomainValidationError('すでにキャンセル済みです', 'PARTICIPATION_ALREADY_CANCELLED')
        }
        this.status = ParticipationStatus.cancelled()
        this.cancelledAt = new Date()
    }

    reattend(): void {
        if (this.status.isAttending()) {
            throw new DomainValidationError('すでに参加済みです', 'PARTICIPATION_ALREADY_ATTENDING')
        }
        this.status = ParticipationStatus.attending()
        this.cancelledAt = null
    }

    /** UBL-8: 支払報告 */
    reportPayment(): void {
        if (!this.paymentStatus) {
            throw new DomainValidationError('無料参加には支払報告は不要です', 'NO_PAYMENT_REQUIRED')
        }
        if (this.paymentStatus.isConfirmed()) {
            throw new DomainValidationError('すでに支払確認済みです', 'PAYMENT_ALREADY_CONFIRMED')
        }
        this.paymentStatus = PaymentStatus.reported()
        this.paymentReportedAt = new Date()
    }

    /** UBL-8: 支払確認（管理者） */
    confirmPayment(confirmedBy: string): void {
        if (!this.paymentStatus) {
            throw new DomainValidationError('無料参加には支払確認は不要です', 'NO_PAYMENT_REQUIRED')
        }
        if (!this.paymentStatus.isReported()) {
            throw new DomainValidationError('支払報告がされていません', 'PAYMENT_NOT_REPORTED')
        }
        this.paymentStatus = PaymentStatus.confirmed()
        this.paymentConfirmedAt = new Date()
        this.paymentConfirmedBy = confirmedBy
    }

    /** UBL-8: 支払却下（管理者） */
    rejectPayment(): void {
        if (!this.paymentStatus) {
            throw new DomainValidationError('無料参加には支払操作は不要です', 'NO_PAYMENT_REQUIRED')
        }
        this.paymentStatus = PaymentStatus.rejected()
    }

    isAttending(): boolean {
        return this.status.isAttending()
    }

    getId(): string { return this.id }
    getScheduleId(): ScheduleId { return this.scheduleId }
    getUserId(): UserId { return this.userId }
    getStatus(): ParticipationStatus { return this.status }
    getIsVisitor(): boolean { return this.isVisitor }
    getRespondedAt(): Date { return this.respondedAt }
    getCancelledAt(): Date | null { return this.cancelledAt }
    getPaymentMethod(): PaymentMethod | null { return this.paymentMethod }
    getPaymentStatus(): PaymentStatus | null { return this.paymentStatus }
    getPaymentReportedAt(): Date | null { return this.paymentReportedAt }
    getPaymentConfirmedAt(): Date | null { return this.paymentConfirmedAt }
    getPaymentConfirmedBy(): string | null { return this.paymentConfirmedBy }
}
