import { validateBody } from '@/api/middleware/validateBody.js';
import { passwordLoginSchema } from '@/api/schemas/index.js';
import { Router } from 'express';
import { passwordAuthController } from '../controllers/passwordAuthController.js';
const router = Router();

/**
 * パスワード認証 API
 * POST /v1/auth/password
 */
router.post('/v1/auth/password', validateBody(passwordLoginSchema), passwordAuthController.login);

export default router;
