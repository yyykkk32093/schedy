import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const webhookController = {
    /** Webhook 設定の作成/更新 */
    async upsert(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { service, webhookUrl, enabled } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createUpsertWebhookConfigUseCase()
            const result = await useCase.execute({
                communityId,
                service: service ?? 'LINE',
                webhookUrl,
                enabled: enabled ?? true,
                userId,
            })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** Webhook 設定一覧取得 */
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createGetWebhookConfigsUseCase()
            const result = await useCase.execute({ communityId, userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** Webhook 設定削除 */
    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId, configId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createDeleteWebhookConfigUseCase()
            await useCase.execute({ communityId, configId, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
