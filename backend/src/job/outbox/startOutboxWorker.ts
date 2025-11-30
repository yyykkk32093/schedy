// src/job/outbox/startOutboxWorker.ts
import dotenv from 'dotenv-flow';
dotenv.config({ node_env: process.env.NODE_ENV || 'local', path: 'env' })

import { OutboxWorkerRegistrar } from '@/bootstrap/outboxWorkerRegistrar.js';
import { logger } from '@/sharedTech/logger/logger.js';

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
