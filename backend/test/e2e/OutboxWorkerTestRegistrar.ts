// test/e2e/OutboxWorkerTestRegistrar.ts

import type { IntegrationDispatcher } from '@/domains/sharedDomains/infrastructure/integration/IntegrationDispatcher.js';
import { OutboxDeadLetterRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxDeadLetterRepository.js';
import { OutboxRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxRepository.js';
import { OutboxRetryPolicyRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxRetryPolicyRepository.js';
import { OutboxWorker } from '@/job/outbox/outboxWorker.js';

export class OutboxWorkerTestRegistrar {
    static createWorker(
        app: any,
        extraHandlers?: (dispatcher: IntegrationDispatcher) => void
    ) {
        const repo = new OutboxRepository();
        const retryRepo = new OutboxRetryPolicyRepository();
        const dlqRepo = new OutboxDeadLetterRepository();

        // ★本番と同じ dispatcher（app の DI 管理下）
        const dispatcher: IntegrationDispatcher = app.get("integrationDispatcher");

        // ★テスト専用の handler をここで追加する（必要なら）
        if (extraHandlers) {
            extraHandlers(dispatcher);
        }

        return new OutboxWorker(repo, retryRepo, dispatcher, dlqRepo);
    }
}
