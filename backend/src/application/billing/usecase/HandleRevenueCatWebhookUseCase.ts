/**
 * RevenueCat Webhook 処理 UseCase
 *
 * RevenueCat からのイベントに基づいてユーザーの plan を更新する。
 * - INITIAL_PURCHASE / RENEWAL → SUBSCRIBER
 * - CANCELLATION / EXPIRATION → FREE
 * - NON_RENEWING_PURCHASE (LIFETIME) → LIFETIME
 */

import { logger } from '@/_sharedTech/logger/logger.js'
import { UserPlan } from '@/domains/user/domain/model/valueObject/UserPlan.js'
import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'
import type { IBillingService } from '@/integration/billing/IBillingService.js'

export interface HandleRevenueCatWebhookInput {
    payload: unknown
}

export class HandleRevenueCatWebhookUseCase {
    constructor(
        private readonly billingService: IBillingService,
        private readonly userRepo: IUserRepository,
    ) { }

    async execute(input: HandleRevenueCatWebhookInput): Promise<void> {
        const info = this.billingService.parseWebhookEvent(input.payload)
        if (!info) {
            logger.info('RevenueCat webhook: Ignored event (no subscription info parsed)')
            return
        }

        const user = await this.userRepo.findById(info.appUserId)
        if (!user) {
            logger.warn(`RevenueCat webhook: User not found: ${info.appUserId}`)
            return
        }

        const currentPlan = user.getPlan().getValue()
        const newPlan = info.plan

        // LIFETIME ユーザーは降格させない（LIFETIME は最上位）
        if (currentPlan === 'LIFETIME' && newPlan !== 'LIFETIME') {
            logger.info(`RevenueCat webhook: Skipping downgrade for LIFETIME user ${info.appUserId}`)
            return
        }

        // プランが変わる場合のみ更新
        if (currentPlan !== newPlan) {
            user.changePlan(UserPlan.create(newPlan))
            await this.userRepo.save(user)
            logger.info(`RevenueCat webhook: Updated user ${info.appUserId} plan: ${currentPlan} → ${newPlan}`)
        }
    }
}
