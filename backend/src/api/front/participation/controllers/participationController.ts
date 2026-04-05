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
            const { isVisitor } = req.body ?? {}
            const userId = req.user!.userId

            const useCase = usecaseFactory.createJoinWaitlistUseCase()
            const result = await useCase.execute({ scheduleId, userId, isVisitor })

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

    /** #40: 現金支払い一括確認（管理者） */
    async bulkConfirmPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const { participationIds } = req.body as { participationIds: string[] }

            if (!Array.isArray(participationIds) || participationIds.length === 0) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'participationIds は1件以上必要です' })
                return
            }

            const useCase = usecaseFactory.createConfirmPaymentUseCase()
            const results: { participationId: string; success: boolean; error?: string }[] = []

            for (const pid of participationIds) {
                try {
                    await useCase.execute({ participationId: pid, confirmedBy: userId })
                    results.push({ participationId: pid, success: true })
                } catch (err) {
                    results.push({
                        participationId: pid,
                        success: false,
                        error: err instanceof Error ? err.message : 'Unknown error',
                    })
                }
            }

            res.json({ results })
        } catch (err) {
            next(err)
        }
    },

    /**
     * 一括支払い更新（All-or-Nothing TX）
     * D-P2-5 / D-P2-6
     */
    async bulkUpdatePayment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const { updates } = req.body as {
                updates: Array<{ participationId: string; paymentMethod: string }>
            }

            if (!Array.isArray(updates) || updates.length === 0) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'updates は1件以上必要です' })
                return
            }

            const useCase = usecaseFactory.createBulkUpdatePaymentUseCase()
            await useCase.execute({
                scheduleId,
                updates,
            })

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

    /** participationId ベースの参加者削除（ロールベース権限制御） */
    async removeParticipation(req: Request, res: Response, next: NextFunction) {
        try {
            const { participationId } = req.params
            const requestUserId = req.user!.userId

            const useCase = usecaseFactory.createRemoveParticipationUseCase()
            await useCase.execute({ participationId, requestUserId })

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

    /** ビジター追加 */
    async addGuestVisitor(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const { visitorName } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createAddGuestVisitorUseCase()
            const result = await useCase.execute({ scheduleId, visitorName, addedBy: userId })
            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** W3-13a: 登録済みビジター追加 */
    async addRegisteredVisitor(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const { visitorUserId } = req.body
            const addedBy = req.user!.userId

            const useCase = usecaseFactory.createAddRegisteredVisitorUseCase()
            const result = await useCase.execute({ scheduleId, visitorUserId, addedBy })
            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** W3-13b: ビジター名サジェスト */
    async suggestVisitorNames(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const query = typeof req.query.q === 'string' ? req.query.q : undefined

            const useCase = usecaseFactory.createSuggestVisitorNamesUseCase()
            const result = await useCase.execute({ communityId, query })
            res.json(result)
        } catch (err) {
            next(err)
        }
    },

    /** ビジター支払い情報更新（管理者） */
    async updateVisitorPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const { participationId } = req.params
            const { paymentMethod, paymentStatus } = req.body

            const useCase = usecaseFactory.createUpdateVisitorPaymentUseCase()
            await useCase.execute({ participationId, paymentMethod, paymentStatus })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** 繰り上げ参加者の支払い方法選択 */
    async selectPaymentMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const { participationId } = req.params
            const { paymentMethod } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createSelectPaymentMethodUseCase()
            await useCase.execute({ participationId, userId, paymentMethod })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
