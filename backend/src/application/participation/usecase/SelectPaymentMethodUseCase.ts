import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { PaymentMethod } from '@/domains/activity/schedule/participation/domain/model/valueObject/PaymentMethod.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type SelectPaymentMethodTxRepositories = {
    participation: IParticipationRepository
    payment: IPaymentRepository
}

/**
 * SelectPaymentMethodUseCase — 繰り上げ参加者が支払い方法を選択
 *
 * WL→繰り上げ時に paymentMethod=null で作成された Payment に対して、
 * 参加者本人が支払い方法を選択するユースケース。
 */
export class SelectPaymentMethodUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<SelectPaymentMethodTxRepositories>,
    ) { }

    async execute(input: {
        participationId: string
        userId: string
        paymentMethod: string
    }): Promise<void> {
        await this.unitOfWork.run(async (repos) => {
            const participation = await repos.participation.findById(input.participationId)
            if (!participation) {
                throw new ParticipationError('参加情報が見つかりません', 'PARTICIPATION_NOT_FOUND')
            }

            // 本人確認
            if (participation.getUserId()?.getValue() !== input.userId) {
                throw new ParticipationError('自分の参加情報のみ更新できます', 'NOT_OWNER')
            }

            const payment = await repos.payment.findByParticipationId(input.participationId)
            if (!payment) {
                throw new ParticipationError('支払い情報が見つかりません', 'PAYMENT_NOT_FOUND')
            }

            const method = PaymentMethod.create(input.paymentMethod)
            payment.selectPaymentMethod(method)
            await repos.payment.update(payment)
        })
    }
}
