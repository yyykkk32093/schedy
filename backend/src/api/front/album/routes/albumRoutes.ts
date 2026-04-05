import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { validateBody } from '@/api/middleware/validateBody.js'
import { addAlbumPhotoSchema, createAlbumSchema } from '@/api/schemas/index.js'
import { Router } from 'express'
import { albumController } from '../controllers/albumController.js'

const router = Router()

// アルバム CRUD
router.get('/v1/communities/:communityId/albums', authMiddleware, albumController.list)
router.post('/v1/communities/:communityId/albums', authMiddleware, validateBody(createAlbumSchema), albumController.create)

// アルバム写真
router.get('/v1/albums/:albumId/photos', authMiddleware, albumController.listPhotos)
router.post('/v1/albums/:albumId/photos', authMiddleware, validateBody(addAlbumPhotoSchema), albumController.addPhoto)
router.delete('/v1/albums/photos/:photoId', authMiddleware, albumController.deletePhoto)

export default router
