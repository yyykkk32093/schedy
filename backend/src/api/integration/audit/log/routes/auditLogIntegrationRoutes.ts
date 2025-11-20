// src/api/integration/audit/logs/routes/auditLogIntegrationRoutes.ts
import { Router } from 'express'
import { auditLogIntegrationController } from '../controllers/auditLogIntegrationController.js'

const router = Router()

/**
 * 🔹 他BCからの IntegrationEvent を受け取る Audit ログ用 API
 * URL: POST /integration/v1/audit/logs
 */
router.post(
    '/integration/v1/audit/logs',
    auditLogIntegrationController.receive.bind(auditLogIntegrationController)
)

export default router
