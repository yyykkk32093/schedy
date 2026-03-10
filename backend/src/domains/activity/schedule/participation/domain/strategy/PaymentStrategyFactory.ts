import type { PaymentMethodType } from '../model/valueObject/PaymentMethod.js'
import { CashStrategy } from './CashStrategy.js'
import type { IPaymentStrategy } from './IPaymentStrategy.js'
import { PayPayStrategy } from './PayPayStrategy.js'
import { StripeStrategy } from './StripeStrategy.js'

const strategies: Record<PaymentMethodType, IPaymentStrategy> = {
    CASH: new CashStrategy(),
    PAYPAY: new PayPayStrategy(),
    STRIPE: new StripeStrategy(),
}

export class PaymentStrategyFactory {
    static resolve(method: PaymentMethodType): IPaymentStrategy {
        return strategies[method]
    }
}
