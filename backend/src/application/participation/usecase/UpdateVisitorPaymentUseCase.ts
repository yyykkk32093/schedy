import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { PaymentMethod } from '@/domains/activity/schedule/participation/domain/model/valueObject/PaymentMethod.js'
import { PaymentStatus } from '@/domains/activity/schedule/participation/domain/model/valueObject/PaymentStatus.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type UpdateVisitorPaymentTxRepositories = {
    payment: IPaymentRepository
}

/**
 * ビジターの支払い情報を管理者が更新する
 * - paymentMethod の設定（null → CASH/PAYPAY 等）
 * - paymentStatus の更新（UNPAID → CONFIRMED 等）
 */
export class UpdateVisitorPaymentUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<UpdateVisitorPaymentTxRepositories>,
    ) { }

    async execute(input: {
        participationId: string
        paymentMethod?: string | null
        paymentStatus?: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const payment = await repos.payment.findByParticipationId(input.participationId)
            if (!payment) {
                throw new ParticipationError('支払い情報が見つかりません', 'PAYMENT_NOT_FOUND')
            }

            const method = input.paymentMethod !== undefined
                ? (input.paymentMethod ? PaymentMethod.create(input.paymentMethod) : null)
                : undefined
            const status = input.paymentStatus
                ? PaymentStatus.reconstruct(input.paymentStatus)
                : undefined

            if (method !== undefined) {
                payment.updateVisitorPayment(method, status ?? payment.getPaymentStatus())
            } else if (status) {
                payment.updateVisitorPayment(payment.getPaymentMethod(), status)
            }

            await repos.payment.update(payment)
        })
    }
}
