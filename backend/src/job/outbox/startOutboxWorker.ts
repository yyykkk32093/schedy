// src/job/outbox/startOutboxWorker.ts
import { loadEnv } from '@/_sharedTech/config/loadEnv.js';
import path from 'path';

loadEnv({ envDir: path.resolve(process.cwd(), 'env') })

import { OutboxWorkerRegistrar } from '@/_bootstrap/outboxWorkerRegistrar.js';
import { logger } from '@/_sharedTech/logger/logger.js';

// const worker = new OutboxWorker()
const worker = OutboxWorkerRegistrar.createWorker();
process.on('SIGINT', async () => {
    logger.warn("🛑 SIGINT received (Ctrl+C)")
    worker.requestShutdown()
})

process.on('SIGTERM', async () => {
    logger.warn("🛑 SIGTERM received")
    worker.requestShutdown()
})

worker.startLoop(3000)
