import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { Router } from 'express'
import { albumController } from '../controllers/albumController.js'

const router = Router()

// アルバム CRUD
router.get('/v1/communities/:communityId/albums', authMiddleware, albumController.list)
router.post('/v1/communities/:communityId/albums', authMiddleware, albumController.create)

// アルバム写真
router.get('/v1/albums/:albumId/photos', authMiddleware, albumController.listPhotos)
router.post('/v1/albums/:albumId/photos', authMiddleware, albumController.addPhoto)
router.delete('/v1/albums/photos/:photoId', authMiddleware, albumController.deletePhoto)

export default router
