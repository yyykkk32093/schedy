import { IUnitOfWorkWithRepos } from '@/application/_sharedApplication/uow/IUnitOfWork.js'
import { PaymentMethod } from '@/domains/activity/schedule/participation/domain/model/valueObject/PaymentMethod.js'
import type { IParticipationRepository } from '@/domains/activity/schedule/participation/domain/repository/IParticipationRepository.js'
import type { IPaymentRepository } from '@/domains/activity/schedule/participation/domain/repository/IPaymentRepository.js'
import { ParticipationError } from '../error/ParticipationError.js'

export type BulkUpdatePaymentTxRepositories = {
    participation: IParticipationRepository
    payment: IPaymentRepository
}

export type BulkPaymentUpdate = {
    participationId: string
    paymentMethod: string // CASH | PAYPAY | CREDIT_CARD
}

/**
 * ビジター支払い方法一括設定 UseCase
 *
 * W3-09: ビジターに対して、
 * 管理者が支払い方法を一括で設定する。
 * ステータスは変更しない（方法だけ設定し、確認は別途一括確認で行う）。
 * All-or-Nothing（1件でもエラーなら全件ロールバック）。
 */
export class BulkUpdatePaymentUseCase {
    constructor(
        private readonly unitOfWork: IUnitOfWorkWithRepos<BulkUpdatePaymentTxRepositories>,
    ) { }

    async execute(input: {
        scheduleId: string
        updates: BulkPaymentUpdate[]
    }): Promise<void> {
        if (input.updates.length === 0) {
            throw new ParticipationError('更新対象が空です', 'EMPTY_UPDATES')
        }

        await this.unitOfWork.run(async (repos) => {
            for (const update of input.updates) {
                const participation = await repos.participation.findById(update.participationId)
                if (!participation) {
                    throw new ParticipationError(
                        `参加情報が見つかりません: ${update.participationId}`,
                        'PARTICIPATION_NOT_FOUND',
                    )
                }

                // スケジュール整合性チェック
                if (participation.getScheduleId().getValue() !== input.scheduleId) {
                    throw new ParticipationError(
                        `参加情報のスケジュールが一致しません: ${update.participationId}`,
                        'SCHEDULE_MISMATCH',
                    )
                }

                // ビジターのみ対象
                if (!participation.getIsVisitor()) {
                    throw new ParticipationError(
                        `ビジター以外は対象外です: ${update.participationId}`,
                        'NOT_VISITOR',
                    )
                }

                // findByParticipationId を使用（ビジターは userId=null の場合もある）
                const payment = await repos.payment.findByParticipationId(update.participationId)
                if (!payment) {
                    throw new ParticipationError(
                        `支払い情報が見つかりません: ${update.participationId}`,
                        'PAYMENT_NOT_FOUND',
                    )
                }

                // 支払い方法のみ設定、ステータスは既存値を維持
                payment.updateVisitorPayment(
                    PaymentMethod.create(update.paymentMethod),
                    payment.getPaymentStatus(),
                )
                await repos.payment.update(payment)
            }
        })
    }
}
