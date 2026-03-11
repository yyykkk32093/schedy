import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

/**
 * 支払報告 UseCase。
 * 参加者が「支払済み」と報告する。
 */
export class ReportPaymentUseCase {
    constructor(
        private readonly participationRepository: IParticipationRepository,
    ) { }

    async execute(input: {
        participationId: string
        userId: string
    }): Promise<void> {
        const participation = await this.participationRepository.findById(input.participationId)
        if (!participation) {
            throw new ParticipationError('参加情報が見つかりません', 'PARTICIPATION_NOT_FOUND')
        }

        // 本人チェック
        if (participation.getUserId().getValue() !== input.userId) {
            throw new ParticipationError('他のユーザーの支払報告はできません', 'FORBIDDEN')
        }

        participation.reportPayment()
        await this.participationRepository.update(participation)
    }
}
