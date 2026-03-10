// src/api/integration/audit/logs/controllers/auditLogIntegrationController.ts
import { RecordAuditLogUseCase } from '@/application/audit/log/usecase/RecordAuditLogUseCase.js';
import type { NextFunction, Request, Response } from 'express';

class AuditLogIntegrationController {
    private readonly usecase = new RecordAuditLogUseCase()

    async receive(req: Request, res: Response, next: NextFunction) {
        try {
            const event = req.body

            // 必須項目チェック
            if (!event?.idempotencyKey) {
                return res.status(400).json({ message: 'Missing idempotencyKey' })
            }

            if (!event?.eventType) {
                return res.status(400).json({ message: 'Missing eventType' })
            }

            if (!event?.payload) {
                return res.status(400).json({ message: 'Missing payload' })
            }

            await this.usecase.execute(event)

            return res.status(200).json({ status: 'ok' })
        } catch (err) {
            next(err)
        }
    }
}

export const auditLogIntegrationController =
    new AuditLogIntegrationController()
