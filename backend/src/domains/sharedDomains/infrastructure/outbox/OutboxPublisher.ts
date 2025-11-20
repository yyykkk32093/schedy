// src/domains/sharedDomains/infrastructure/outbox/OutboxPublisher.ts
import { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { sleep } from '@/sharedTech/util/sleep.js'
import { IntegrationDispatcher } from '../integration/IntegrationDispatcher.js'
import { OutboxRepository } from './OutboxRepository.js'

export class OutboxPublisher {
    constructor(
        private readonly repo: IOutboxRepository = new OutboxRepository(),
        private readonly dispatcher: IntegrationDispatcher = new IntegrationDispatcher(),
    ) { }

    registerHandler(routingKey: string, handler: any) {
        this.dispatcher.register(routingKey, handler)
    }

    async publishPending() {
        const events = await this.repo.findPending(50)

        for (const ev of events) {
            try {
                console.log(`[OutboxPublisher] dispatch id=${ev.id} routingKey=${ev.routingKey}`)

                await this.dispatcher.dispatch(ev.routingKey, ev)

                await this.repo.markAsPublished(ev.id)
            } catch (err) {
                console.error('[OutboxPublisher] dispatch error:', err)

                const willFail = ev.retryCount + 1 >= ev.maxRetries

                if (willFail) {
                    await this.repo.markAsFailed(ev.id)
                } else {
                    await sleep(ev.retryInterval)
                    await this.repo.incrementRetryCount(ev.id)
                }
            }
        }
    }
}
