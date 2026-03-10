/**
 * Recurrence Worker — 定期実行ジョブ
 *
 * recurrenceRule を持つ Activity から 14 日先までのスケジュールを自動生成する。
 * Cron or setInterval で定期的に呼び出される想定。
 */
import { loadEnv } from '@/_sharedTech/config/loadEnv.js'
import path from 'path'

loadEnv({ envDir: path.resolve(process.cwd(), 'env') })

import { prisma } from '@/_sharedTech/db/client.js'
import { logger } from '@/_sharedTech/logger/logger.js'
import { GenerateRecurringSchedulesUseCase } from '@/application/schedule/usecase/GenerateRecurringSchedulesUseCase.js'
import { UuidGenerator } from '@/domains/_sharedDomains/infrastructure/id/UuidGenerator.js'
import { ActivityRepositoryImpl } from '@/domains/activity/infrastructure/repository/ActivityRepositoryImpl.js'
import { ScheduleRepositoryImpl } from '@/domains/activity/schedule/infrastructure/repository/ScheduleRepositoryImpl.js'

const INTERVAL_MS = 60 * 60 * 1000 // 1時間ごと

let shuttingDown = false

async function runOnce() {
    const useCase = new GenerateRecurringSchedulesUseCase(
        new UuidGenerator(),
        new ActivityRepositoryImpl(prisma),
        new ScheduleRepositoryImpl(prisma),
    )
    const result = await useCase.execute({ daysAhead: 14 })
    if (result.generatedCount > 0) {
        logger.info(`🔄 Recurrence worker generated ${result.generatedCount} schedule(s)`)
    }
}

async function loop() {
    logger.info('🔄 Recurrence worker started')
    while (!shuttingDown) {
        try {
            await runOnce()
        } catch (err) {
            logger.error({ err }, '❌ Recurrence worker error')
        }
        await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS))
    }
    logger.info('🛑 Recurrence worker stopped')
}

process.on('SIGINT', () => {
    logger.warn('🛑 SIGINT received')
    shuttingDown = true
})
process.on('SIGTERM', () => {
    logger.warn('🛑 SIGTERM received')
    shuttingDown = true
})

loop()
