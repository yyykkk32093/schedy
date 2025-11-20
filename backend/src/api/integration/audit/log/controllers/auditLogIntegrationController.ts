// src/api/integration/audit/logs/controllers/auditLogIntegrationController.ts
import { RecordAuditLogUseCase } from '@/application/audit/log/usecase/RecordAuditLogUseCase.js'
import type { Request, Response } from 'express'

class AuditLogIntegrationController {
    private readonly usecase = new RecordAuditLogUseCase()

    async receive(req: Request, res: Response) {
        try {
            const event = req.body

            // 🔹 最新方針に合わせて eventType をチェック
            if (!event?.eventType) {
                return res.status(400).json({ message: 'Missing eventType' })
            }

            if (!event?.payload) {
                return res.status(400).json({ message: 'Missing payload' })
            }

            // 🔹 UseCase にそのまま渡す（DTO変換はUseCase側が行う）
            await this.usecase.execute(event)

            return res.status(200).json({ status: 'ok' })
        } catch (e) {
            console.error('[AuditLogIntegrationController] Error:', e)
            return res.status(500).json({ message: 'Internal Server Error' })
        }
    }
}

export const auditLogIntegrationController =
    new AuditLogIntegrationController()
