import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_STATUSES = ['UNPAID', 'REPORTED', 'CONFIRMED', 'REJECTED'] as const
export type PaymentStatusType = (typeof VALID_STATUSES)[number]

export class PaymentStatus extends ValueObject<PaymentStatusType> {
    private constructor(value: PaymentStatusType) {
        super(value)
    }

    static create(value: string): PaymentStatus {
        if (!VALID_STATUSES.includes(value as PaymentStatusType)) {
            throw new DomainValidationError(
                `無効な支払ステータスです: ${value}`,
                'INVALID_PAYMENT_STATUS',
            )
        }
        return new PaymentStatus(value as PaymentStatusType)
    }

    static unpaid(): PaymentStatus { return new PaymentStatus('UNPAID') }
    static reported(): PaymentStatus { return new PaymentStatus('REPORTED') }
    static confirmed(): PaymentStatus { return new PaymentStatus('CONFIRMED') }
    static rejected(): PaymentStatus { return new PaymentStatus('REJECTED') }

    static reconstruct(value: string): PaymentStatus {
        return new PaymentStatus(value as PaymentStatusType)
    }

    isUnpaid(): boolean { return this.value === 'UNPAID' }
    isReported(): boolean { return this.value === 'REPORTED' }
    isConfirmed(): boolean { return this.value === 'CONFIRMED' }
    isRejected(): boolean { return this.value === 'REJECTED' }
}
