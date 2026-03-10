import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

/**
 * 支払確認 UseCase。
 * 管理者が参加者の支払を確認する。
 */
export class ConfirmPaymentUseCase {
    constructor(
        private readonly participationRepository: IParticipationRepository,
    ) { }

    async execute(input: {
        participationId: string
        confirmedBy: string
    }): Promise<void> {
        const participation = await this.participationRepository.findById(input.participationId)
        if (!participation) {
            throw new ParticipationError('参加情報が見つかりません', 'PARTICIPATION_NOT_FOUND')
        }

        participation.confirmPayment(input.confirmedBy)
        await this.participationRepository.save(participation)
    }
}
