import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_METHODS = ['CASH', 'PAYPAY', 'STRIPE'] as const
export type PaymentMethodType = (typeof VALID_METHODS)[number]

export class PaymentMethod extends ValueObject<PaymentMethodType> {
    private constructor(value: PaymentMethodType) {
        super(value)
    }

    static create(value: string): PaymentMethod {
        if (!VALID_METHODS.includes(value as PaymentMethodType)) {
            throw new DomainValidationError(
                `無効な支払方法です: ${value}`,
                'INVALID_PAYMENT_METHOD',
            )
        }
        return new PaymentMethod(value as PaymentMethodType)
    }

    static cash(): PaymentMethod { return new PaymentMethod('CASH') }
    static paypay(): PaymentMethod { return new PaymentMethod('PAYPAY') }
    static stripe(): PaymentMethod { return new PaymentMethod('STRIPE') }

    static reconstruct(value: string): PaymentMethod {
        return new PaymentMethod(value as PaymentMethodType)
    }

    isCash(): boolean { return this.value === 'CASH' }
    isPayPay(): boolean { return this.value === 'PAYPAY' }
    isStripe(): boolean { return this.value === 'STRIPE' }
}
