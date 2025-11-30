// test/e2e/eventSubscribersRegistrarForTest.ts


import { IntegrationDispatcher } from "@/domains/sharedDomains/infrastructure/integration/IntegrationDispatcher.js";
import { AuditLogIntegrationHandler } from "@/domains/sharedDomains/infrastructure/integration/handler/AuditLogIntegrationHandler.js";
import { OutboxRepository } from "@/domains/sharedDomains/infrastructure/outbox/OutboxRepository.js";

import { registerAuthDomainSubscribers } from "@/domains/auth/sharedAuth/domain/event/AuthDomainSubscribersRegistrar.js";
import { FakeHttpClient } from "./FakeHttpClient.js";

export class DomainEventTestRegistrar {
    static registerAll(app: any) {
        /**
         * 1. OutboxRepository（test DB 接続）
         */
        const outboxRepo = new OutboxRepository();

        /**
         * 2. Auth → Outbox
         *    （本番と同じイベント購読者を登録）
         */
        registerAuthDomainSubscribers(outboxRepo);

        /**
         * 3. Outbox → Audit API（統一 DI の dispatcher に FakeHttpClient を注入）
         */
        const dispatcher: IntegrationDispatcher = app.get("integrationDispatcher");

        dispatcher.register(
            "audit.log",
            new AuditLogIntegrationHandler(new FakeHttpClient(app))
        );
    }
}
