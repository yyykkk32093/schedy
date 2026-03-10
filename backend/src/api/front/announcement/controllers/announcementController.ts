import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const announcementController = {
    async feed(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const cursor = req.query.cursor as string | undefined
            const limit = req.query.limit ? Number(req.query.limit) : undefined

            const useCase = usecaseFactory.createGetAnnouncementFeedUseCase()
            const result = await useCase.execute({ userId, cursor, limit })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** UBL-4: 検索 */
    async search(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const keyword = (req.query.q as string) ?? ''
            const limit = req.query.limit ? Number(req.query.limit) : undefined
            const offset = req.query.offset ? Number(req.query.offset) : undefined

            const useCase = usecaseFactory.createSearchAnnouncementsUseCase()
            const result = await useCase.execute({ userId, keyword, limit, offset })

            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { title, content, attachments } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCreateAnnouncementUseCase()
            const result = await useCase.execute({ communityId, title, content, userId, attachments })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createListAnnouncementsUseCase()
            const result = await useCase.execute({ communityId, userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            const useCase = usecaseFactory.createFindAnnouncementUseCase()
            const result = await useCase.execute({ announcementId: id })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createMarkAnnouncementAsReadUseCase()
            await useCase.execute({ announcementId: id, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async softDelete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createDeleteAnnouncementUseCase()
            await useCase.execute({ announcementId: id, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    /** UBL-1: いいね Toggle */
    async toggleLike(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: announcementId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createToggleAnnouncementLikeUseCase()
            const result = await useCase.execute({ announcementId, userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** UBL-2: コメント一覧 */
    async listComments(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: announcementId } = req.params
            const cursor = req.query.cursor as string | undefined
            const limit = req.query.limit ? Number(req.query.limit) : undefined

            const useCase = usecaseFactory.createListAnnouncementCommentsUseCase()
            const result = await useCase.execute({ announcementId, cursor, limit })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** UBL-2: コメント作成 */
    async createComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: announcementId } = req.params
            const { content } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCreateAnnouncementCommentUseCase()
            const result = await useCase.execute({ announcementId, userId, content })
            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** UBL-2: コメント削除 */
    async deleteComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { commentId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createDeleteAnnouncementCommentUseCase()
            await useCase.execute({ commentId, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
