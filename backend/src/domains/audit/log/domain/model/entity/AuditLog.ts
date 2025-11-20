// src/domains/audit/log/domain/model/entity/AuditLog.ts
import { IIdGenerator } from '@/domains/sharedDomains/domain/service/IIdGenerator.js'

export class AuditLog {
    readonly id: string
    readonly eventType: string
    readonly userId: string
    readonly authMethod: string
    readonly detail?: string | null
    readonly occurredAt: Date
    readonly createdAt: Date

    constructor(
        idGen: IIdGenerator,
        params: {
            id?: string
            eventType: string
            userId: string
            authMethod: string
            detail?: string | null
            occurredAt?: Date
            createdAt?: Date
        },
    ) {
        this.id = params.id ?? idGen.generate()
        this.eventType = params.eventType
        this.userId = params.userId
        this.authMethod = params.authMethod
        this.detail = params.detail ?? null
        this.occurredAt = params.occurredAt ?? new Date()
        this.createdAt = params.createdAt ?? new Date()
    }
}
