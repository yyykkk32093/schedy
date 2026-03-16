import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
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
 *
 * ビジター種別:
 * - isVisitor=false → 通常メンバー（userId必須）
 * - isVisitor=true + userId=set → 登録済みビジター（本人操作可能）
 * - isVisitor=true + userId=null → 未登録ビジター（visitorName必須、addedBy必須）
 */
export class Participation extends AggregateRoot {
    private constructor(
        private readonly id: string,
        private readonly scheduleId: ScheduleId,
        private readonly userId: UserId | null,
        private readonly isVisitor: boolean,
        private readonly visitorName: string | null,
        private readonly addedBy: string | null,
        private readonly respondedAt: Date,
    ) {
        super()
    }

    /**
     * 通常参加 or 登録済みビジター用ファクトリ
     */
    static create(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        isVisitor?: boolean
        addedBy?: string | null
    }): Participation {
        return new Participation(
            params.id,
            params.scheduleId,
            params.userId,
            params.isVisitor ?? false,
            null,
            params.addedBy ?? null,
            new Date(),
        )
    }

    /**
     * 未登録ビジター用ファクトリ
     */
    static createGuestVisitor(params: {
        id: string
        scheduleId: ScheduleId
        visitorName: string
        addedBy: string
    }): Participation {
        if (!params.visitorName || params.visitorName.trim().length === 0) {
            throw new DomainValidationError('ビジター名は必須です', 'VISITOR_NAME_REQUIRED')
        }
        if (params.visitorName.length > 50) {
            throw new DomainValidationError('ビジター名は50文字以内にしてください', 'VISITOR_NAME_TOO_LONG')
        }
        return new Participation(
            params.id,
            params.scheduleId,
            null,
            true,
            params.visitorName.trim(),
            params.addedBy,
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
        respondedAt: Date
    }): Participation {
        return new Participation(
            params.id,
            params.scheduleId,
            params.userId,
            params.isVisitor,
            params.visitorName,
            params.addedBy,
            params.respondedAt,
        )
    }

    /** 未登録ビジターかどうか */
    isGuestVisitor(): boolean {
        return this.isVisitor && this.userId === null
    }

    /** 登録済みビジターかどうか */
    isRegisteredVisitor(): boolean {
        return this.isVisitor && this.userId !== null
    }

    getId(): string { return this.id }
    getScheduleId(): ScheduleId { return this.scheduleId }
    getUserId(): UserId | null { return this.userId }
    getIsVisitor(): boolean { return this.isVisitor }
    getVisitorName(): string | null { return this.visitorName }
    getAddedBy(): string | null { return this.addedBy }
    getRespondedAt(): Date { return this.respondedAt }
}
