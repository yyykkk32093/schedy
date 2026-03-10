import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const albumController = {
    /** アルバム一覧 */
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const useCase = usecaseFactory.createListAlbumsUseCase()
            const result = await useCase.execute({ communityId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** アルバム作成 */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const { title, description } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createCreateAlbumUseCase()
            const result = await useCase.execute({ communityId, title, description, userId })
            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** アルバム写真一覧 */
    async listPhotos(req: Request, res: Response, next: NextFunction) {
        try {
            const { albumId } = req.params
            const useCase = usecaseFactory.createListAlbumPhotosUseCase()
            const result = await useCase.execute({ albumId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** アルバム写真追加 */
    async addPhoto(req: Request, res: Response, next: NextFunction) {
        try {
            const { albumId } = req.params
            const { fileUrl, fileName, mimeType, fileSize } = req.body
            const userId = req.user!.userId

            const useCase = usecaseFactory.createAddAlbumPhotoUseCase()
            const result = await useCase.execute({ albumId, fileUrl, fileName, mimeType, fileSize, userId })
            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    /** アルバム写真削除 */
    async deletePhoto(req: Request, res: Response, next: NextFunction) {
        try {
            const { photoId } = req.params
            const userId = req.user!.userId

            const useCase = usecaseFactory.createDeleteAlbumPhotoUseCase()
            await useCase.execute({ photoId, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
