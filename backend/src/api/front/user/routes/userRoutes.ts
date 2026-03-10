import { Router } from 'express'

import { authMiddleware } from '@/api/middleware/authMiddleware.js'
import { userController } from '../controllers/userController.js'

const router = Router()

/**
 * ユーザ登録 API
 * POST /v1/users
 */
router.post('/v1/users', userController.signUp)

// ---- UBL-32: マイページ ----
router.get('/v1/users/me/profile', authMiddleware, userController.getProfile)
router.patch('/v1/users/me', authMiddleware, userController.updateProfile)

export default router
