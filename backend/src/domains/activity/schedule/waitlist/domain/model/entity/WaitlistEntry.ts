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
        private readonly userId: UserId | null,
        private readonly isVisitor: boolean,
        private readonly visitorName: string | null,
        private readonly addedBy: string | null,
        private readonly registeredAt: Date,
    ) {
        super()
    }

    static create(params: {
        id: string
        scheduleId: ScheduleId
        userId?: UserId | null
        isVisitor?: boolean
        visitorName?: string | null
        addedBy?: string | null
    }): WaitlistEntry {
        return new WaitlistEntry(
            params.id,
            params.scheduleId,
            params.userId ?? null,
            params.isVisitor ?? false,
            params.visitorName ?? null,
            params.addedBy ?? null,
            new Date(),
        )
    }

    static reconstruct(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId | null
        isVisitor: boolean
        visitorName: string | null
        addedBy: string | null
        registeredAt: Date
    }): WaitlistEntry {
        return new WaitlistEntry(
            params.id,
            params.scheduleId,
            params.userId,
            params.isVisitor,
            params.visitorName,
            params.addedBy,
            params.registeredAt,
        )
    }

    getId(): string { return this.id }
    getScheduleId(): ScheduleId { return this.scheduleId }
    getUserId(): UserId | null { return this.userId }
    getIsVisitor(): boolean { return this.isVisitor }
    getVisitorName(): string | null { return this.visitorName }
    getAddedBy(): string | null { return this.addedBy }
    getRegisteredAt(): Date { return this.registeredAt }
}
