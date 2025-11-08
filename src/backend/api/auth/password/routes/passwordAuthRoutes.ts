import { Router } from 'express';
import { passwordAuthController } from '../controllers/passwordAuthController';

const router = Router();

/**
 * パスワード認証 API
 * POST /v1/auth/password
 */
router.post('/v1/auth/password', passwordAuthController.login);

export default router;
