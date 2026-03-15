import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'

/**
 * Participation: Schedule への参加レコード（物理削除方式）。
 * - レコード存在 = 参加中（ATTENDING）
 * - レコード不在 = 未回答 or キャンセル済み（履歴は ParticipationAuditLog に記録）
 *
 * 支払い管理は Payment エンティティに分離。
 * Participation は純粋に「出欠」のみを表す。
 */
export class Participation extends AggregateRoot {
    private constructor(
        private readonly id: string,
        private readonly scheduleId: ScheduleId,
        private readonly userId: UserId,
        private readonly isVisitor: boolean,
        private readonly respondedAt: Date,
    ) {
        super()
    }

    static create(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        isVisitor?: boolean
    }): Participation {
        return new Participation(
            params.id,
            params.scheduleId,
            params.userId,
            params.isVisitor ?? false,
            new Date(),
        )
    }

    static reconstruct(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        isVisitor: boolean
        respondedAt: Date
    }): Participation {
        return new Participation(
            params.id,
            params.scheduleId,
            params.userId,
            params.isVisitor,
            params.respondedAt,
        )
    }

    getId(): string { return this.id }
    getScheduleId(): ScheduleId { return this.scheduleId }
    getUserId(): UserId { return this.userId }
    getIsVisitor(): boolean { return this.isVisitor }
    getRespondedAt(): Date { return this.respondedAt }
}
