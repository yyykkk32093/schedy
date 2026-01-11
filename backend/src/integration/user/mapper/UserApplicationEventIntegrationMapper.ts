// src/integration/user/mapper/UserApplicationEventIntegrationMapper.ts

import { IntegrationSource } from '@/integration/IntegrationSource.js'
import { OutboxEvent } from '@/integration/outbox/model/entity/OutboxEvent.js'

/**
 * UserApplicationEventIntegrationMapper
 *
 * - User 境界の ApplicationEvent を IntegrationEvent に変換する
 * - 現時点では対象イベントなし
 *
 * 📝 将来:
 *   - UserProfileUpdatedEvent
 *   - UserDeactivatedEvent
 *   などが追加されたらここに実装する
 */
export class UserApplicationEventIntegrationMapper {

    tryMap(_event: IntegrationSource): OutboxEvent | null {
        // 現時点では User ApplicationEvent を Integration に出さない
        return null
    }
}
