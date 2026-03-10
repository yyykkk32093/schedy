// src/job/outbox/OutboxWorker.ts

import { logger } from '@/_sharedTech/logger/logger.js'
import { computeEqualJitterDelay } from '@/_sharedTech/util/retry.js'
import { sleep } from '@/_sharedTech/util/sleep.js'

import type { IntegrationDispatcher } from '@/integration/dispatcher/IntegrationDispatcher.js'
import { HandlerInternalError, IntegrationError } from '@/integration/error/IntegrationError.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'
import { IOutboxDeadLetterRepository } from '@/integration/outbox/repository/IOutboxDeadLetterRepository.js'
import type { IOutboxRepository } from '@/integration/outbox/repository/IOutboxRepository.js'
import { IOutboxRetryPolicyRepository } from '@/integration/outbox/repository/IOutboxRetryPolicyRepository.js'


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


    private async processEvent(ev: OutboxEvent): Promise<void> {
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
        catch (rawErr) {
            // IntegrationError でなければ HandlerInternalError で wrap
            const err = rawErr instanceof IntegrationError
                ? rawErr
                : new HandlerInternalError(
                    rawErr instanceof Error ? rawErr.message : String(rawErr),
                    rawErr,
                )

            logger.error(
                { ...ctx, errorType: err.errorType, retryable: err.retryable, error: err },
                "Event dispatch failed",
            )

            // ── retryable=false → 即 FAILED + DLQ ──
            if (!err.retryable) {
                await this.dlqRepo.save(ev, err)
                await this.repo.markAsFailed(ev.outboxEventId)
                logger.error(ctx, "Event FAILED (non-retryable)")
                return
            }

            // ── retryable=true → リトライ or maxRetries 到達で DLQ ──
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
