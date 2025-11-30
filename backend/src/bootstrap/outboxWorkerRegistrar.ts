// src/bootstrap/outboxWorkerRegistrar.ts
import { IntegrationDispatcher } from '@/domains/sharedDomains/infrastructure/integration/IntegrationDispatcher.js'
import { OutboxDeadLetterRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxDeadLetterRepository.js'
import { OutboxRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxRepository.js'
import { OutboxRetryPolicyRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxRetryPolicyRepository.js'
import { OutboxWorker } from '@/job/outbox/outboxWorker.js'
import { IntegrationDispatcherRegistrar } from './integrationDispatcherRegistrar.js'

export class OutboxWorkerRegistrar {

    static createWorker(): OutboxWorker {
        const repo = new OutboxRepository()
        const retryRepo = new OutboxRetryPolicyRepository()
        const dispatcher = new IntegrationDispatcher()
        const dlqRepo = new OutboxDeadLetterRepository()

        IntegrationDispatcherRegistrar.registerAll(dispatcher)

        return new OutboxWorker(repo, retryRepo, dispatcher, dlqRepo)
    }
}
