// src/domains/audit/log/domain/model/entity/AuditLog.ts

import { IIdGenerator } from "@/domains/sharedDomains/domain/service/IIdGenerator.js"

/**
 * 🔒 個人情報を含まない監査ログエンティティ
 * ユーザーID、認証方式、発生イベント名、時刻を記録。
 */
export class AuditLog {
    readonly id: string
    readonly eventName: string
    readonly userId: string
    readonly authMethod: string
    readonly occurredAt: Date
    readonly createdAt: Date

    constructor(
        private readonly idGenerator: IIdGenerator,
        params: {
            id?: string
            eventName: string
            userId: string
            authMethod: string
            occurredAt?: Date
            createdAt?: Date
        },
    ) {
        this.id = params.id ?? idGenerator.generate()
        this.eventName = params.eventName
        this.userId = params.userId
        this.authMethod = params.authMethod
        this.occurredAt = params.occurredAt ?? new Date()
        this.createdAt = params.createdAt ?? new Date()
    }

    static fromIntegrationEvent(event: any, idGenerator: IIdGenerator): AuditLog {
        return new AuditLog(idGenerator, {
            eventName: event.eventName,
            userId: event.payload.userId,
            authMethod: event.payload.authMethod,
            occurredAt: new Date(event.occurredAt),
        })
    }
}
