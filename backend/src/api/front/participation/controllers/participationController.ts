import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const participationController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const useCase = usecaseFactory.createListParticipationsUseCase()
            const result = await useCase.execute({ scheduleId })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    async attend(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const { isVisitor, paymentMethod } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createAttendScheduleUseCase()
            const result = await useCase.execute({ scheduleId, userId, isVisitor, paymentMethod })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCancelParticipationUseCase()
            await useCase.execute({ scheduleId, userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async joinWaitlist(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createJoinWaitlistUseCase()
            const result = await useCase.execute({ scheduleId, userId })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async cancelWaitlist(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCancelWaitlistUseCase()
            await useCase.execute({ scheduleId, userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** UBL-8: 支払報告 */
    async reportPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const { participationId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createReportPaymentUseCase()
            await useCase.execute({ participationId, userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** UBL-8: 支払確認（管理者） */
    async confirmPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const { participationId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createConfirmPaymentUseCase()
            await useCase.execute({ participationId, confirmedBy: userId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async listWaitlist(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const useCase = usecaseFactory.createListWaitlistEntriesUseCase()
            const result = await useCase.execute({ scheduleId })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 管理者による参加者除外 */
    async removeParticipant(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId, userId: targetUserId } = req.params
            const adminUserId = req.user!.userId

            const useCase = usecaseFactory.createRemoveParticipantByAdminUseCase()
            await useCase.execute({ scheduleId, targetUserId, adminUserId })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** 4-4: 参加履歴（直近キャンセル情報） */
    async getMyHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createGetParticipationHistoryUseCase()
            const result = await useCase.execute({ scheduleId, userId })

            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 4-2: Stripe PaymentIntent 作成 */
    async createStripePaymentIntent(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createStripePaymentIntentUseCase()
            const result = await useCase.execute({ scheduleId, userId })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 返金待ち Payment 一覧（スケジュール単位） */
    async listRefundPendingBySchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const useCase = usecaseFactory.createListRefundPendingPaymentsUseCase()
            const result = await useCase.execute({ scheduleId })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 返金待ち Payment 一覧（コミュニティ単位） */
    async listRefundPendingByCommunity(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: communityId } = req.params
            const useCase = usecaseFactory.createListRefundPendingPaymentsUseCase()
            const result = await useCase.execute({ communityId })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 返金履歴（コミュニティ単位：REFUNDED / NO_REFUND） */
    async listPaymentHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: communityId } = req.params
            const useCase = usecaseFactory.createListPaymentHistoryUseCase()
            const result = await useCase.execute({ communityId })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    /** 返金完了マーク（管理者） */
    async markRefundCompleted(req: Request, res: Response, next: NextFunction) {
        try {
            const { paymentId } = req.params
            const useCase = usecaseFactory.createMarkRefundCompletedUseCase()
            await useCase.execute({ paymentId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** 返金不要マーク（管理者） */
    async markNoRefund(req: Request, res: Response, next: NextFunction) {
        try {
            const { paymentId } = req.params
            const useCase = usecaseFactory.createMarkNoRefundUseCase()
            await useCase.execute({ paymentId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** 返金ステータス巻き戻し（管理者） */
    async revertRefundStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { paymentId } = req.params
            const useCase = usecaseFactory.createRevertRefundStatusUseCase()
            await useCase.execute({ paymentId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
