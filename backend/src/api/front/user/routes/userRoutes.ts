import { Router } from 'express'

import { userController } from '../controllers/userController.js'

const router = Router()

/**
 * ユーザ登録 API
 * POST /v1/users
 */
router.post('/v1/users', userController.signUp)

export default router
