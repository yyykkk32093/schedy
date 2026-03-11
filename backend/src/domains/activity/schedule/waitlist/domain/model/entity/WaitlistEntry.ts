import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'

/**
 * WaitlistEntry: キャンセル待ちエントリー（物理削除方式）。
 * - レコード存在 = キャンセル待ち中
 * - レコード不在 = 未登録 or キャンセル/繰り上げ済み（履歴は WaitlistAuditLog に記録）
 * - 順番は registeredAt の昇順で決定
 */
export class WaitlistEntry extends AggregateRoot {
    private constructor(
        private readonly id: string,
        private readonly scheduleId: ScheduleId,
        private readonly userId: UserId,
        private readonly registeredAt: Date,
    ) {
        super()
    }

    static create(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
    }): WaitlistEntry {
        return new WaitlistEntry(
            params.id,
            params.scheduleId,
            params.userId,
            new Date(),
        )
    }

    static reconstruct(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        registeredAt: Date
    }): WaitlistEntry {
        return new WaitlistEntry(
            params.id,
            params.scheduleId,
            params.userId,
            params.registeredAt,
        )
    }

    getId(): string { return this.id }
    getScheduleId(): ScheduleId { return this.scheduleId }
    getUserId(): UserId { return this.userId }
    getRegisteredAt(): Date { return this.registeredAt }
}
