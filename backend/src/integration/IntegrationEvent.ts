export type IntegrationEvent = {
    /** 元になった内部イベントID（DomainEvent/ApplicationEvent の id） */
    sourceEventId: string

    /** 元になった内部イベント名（例: UserLoginSucceededEvent） */
    sourceEventName: string

    occurredAt: Date

    /** 集約ID（配送・監査の主語になるID） */
    aggregateId: string

    /** 外部契約: イベント種別（例: auth.login.success） */
    eventType: string

    /** 外部契約: routingKey（配送先の明示的契約） */
    routingKey: string

    payload: Record<string, unknown>

    /**
     * 外部契約: 冪等キー
     * 方針: ${sourceEventId}:${routingKey}:${eventType}
     */
    idempotencyKey: string
}
