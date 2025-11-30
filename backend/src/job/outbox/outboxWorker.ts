// src/job/outbox/OutboxWorker.ts

import { logger } from '@/sharedTech/logger/logger.js'
import { computeEqualJitterDelay } from '@/sharedTech/util/retry.js'
import { sleep } from '@/sharedTech/util/sleep.js'

import { IOutboxDeadLetterRepository } from '@/domains/sharedDomains/domain/integration/IOutboxDeadLetterRepository.js'
import type { IOutboxRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRepository.js'
import { IOutboxRetryPolicyRepository } from '@/domains/sharedDomains/domain/integration/IOutboxRetryPolicyRepository.js'
import type { IntegrationDispatcher } from '@/domains/sharedDomains/infrastructure/integration/IntegrationDispatcher.js'


export class OutboxWorker {

    private isShuttingDown = false
    private isProcessing = false

    constructor(
        private readonly repo: IOutboxRepository,
        private readonly retryPolicyRepo: IOutboxRetryPolicyRepository,
        private readonly dispatcher: IntegrationDispatcher,
        private readonly dlqRepo: IOutboxDeadLetterRepository,
    ) { }

    requestShutdown() {
        this.isShuttingDown = true
        logger.warn("Worker shutdown requested")
    }


    async runOnce(limit = 20): Promise<void> {
        if (this.isShuttingDown) return

        const events = await this.repo.findPending(limit)
        if (events.length === 0) {
            logger.debug("No pending outbox events")
            return
        }

        logger.info({ count: events.length }, "Processing outbox events")

        this.isProcessing = true
        try {
            for (const ev of events) {
                if (this.isShuttingDown) break
                await this.processEvent(ev)
            }
        } finally {
            this.isProcessing = false
        }
    }


    private async processEvent(ev: any): Promise<void> {
        const ctx = { outboxEventId: ev.outboxEventId, routingKey: ev.routingKey }

        // RetryPolicy fetch
        const policy = await this.retryPolicyRepo.findByRoutingKey(ev.routingKey)
        if (!policy) {
            logger.error(ctx, "No retry policy found → marking FAILED")
            await this.repo.markAsFailed(ev.outboxEventId)
            return
        }

        try {
            // dispatch
            await this.dispatcher.dispatch(ev.routingKey, ev)

            await this.repo.markAsPublished(ev.outboxEventId)
            logger.info(ctx, "Event published")
        }
        catch (err) {
            logger.error({ ...ctx, error: err }, "Event dispatch failed")

            const nextRetry = ev.retryCount + 1

            if (nextRetry >= policy.maxRetries) {
                await this.dlqRepo.save(ev, err)
                await this.repo.markAsFailed(ev.outboxEventId)
                logger.error(ctx, "Event FAILED (max retries exceeded)")
                return
            }

            const delay = computeEqualJitterDelay(
                policy.baseInterval,
                ev.retryCount,
                policy.maxInterval
            )
            const nextTime = new Date(Date.now() + delay)

            await this.repo.updateNextRetryAt(ev.outboxEventId, nextTime)
            await this.repo.incrementRetryCount(ev.outboxEventId)

            logger.warn(
                {
                    ...ctx,
                    retryCount: nextRetry,
                    maxRetries: policy.maxRetries,
                    delay,
                    nextRetryAt: nextTime,
                },
                "Retry scheduled"
            )
        }
    }


    async startLoop(intervalMs = 3000): Promise<void> {
        logger.info("OutboxWorker started")

        logger.debug({ env: process.env.NODE_ENV }, "NODE_ENV")
        logger.debug({ dburl: process.env.DATABASE_URL }, "WORKER DB URL CHECK")

        while (!this.isShuttingDown) {
            logger.debug("OutboxWorker polling tick")
            await this.runOnce()
            await sleep(intervalMs)
        }

        logger.warn("Worker shutting down...")

        while (this.isProcessing) {
            logger.info("Waiting for current task to complete...")
            await sleep(200)
        }

        logger.info("OutboxWorker shutdown complete")
    }
}
