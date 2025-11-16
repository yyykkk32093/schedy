// src/api/system/audit/log/controllers/recordAuthAuditLogController.ts
import { RecordAuthAuditLogUseCase } from '@/application/audit/log/usecase/RecordAuthAuditLogUseCase.js'
import { Request, Response } from 'express'

export const recordAuthAuditLogController = {
    async record(req: Request, res: Response) {
        try {
            const usecase = new RecordAuthAuditLogUseCase()
            await usecase.execute(req.body)
            res.status(200).json({ status: 'ok' })
        } catch (err) {
            console.error('[RecordAuthAuditLogController] Error:', err)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    },
}
