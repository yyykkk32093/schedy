// src/api/system/audit/log/routes/recordAuthAuditLogRoutes.ts
import { Router } from 'express'
import { recordAuthAuditLogController } from '../controllers/recordAuthAuditLogController.js'

const router = Router()

/**
 * 🔹 Authドメインから送信される IntegrationEvent を受信し、
 *     Auditログを記録するエンドポイント。
 *
 * URL例: POST /api/system/audit/log/auth
 */
router.post('/api/system/audit/log/auth', recordAuthAuditLogController.record)

export default router
