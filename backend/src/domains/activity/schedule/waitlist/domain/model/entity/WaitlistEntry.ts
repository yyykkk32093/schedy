import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import { WaitlistStatus } from '../valueObject/WaitlistStatus.js'

/**
 * WaitlistEntry: キャンセル待ちエントリー。
 * - position: 待ち順（1, 2, 3...）
 * - status: WAITING | PROMOTED | CANCELLED
 */
export class WaitlistEntry extends AggregateRoot {
    private constructor(
        private readonly id: string,
        private readonly scheduleId: ScheduleId,
        private readonly userId: UserId,
        private position: number,
        private status: WaitlistStatus,
        private readonly registeredAt: Date,
        private promotedAt: Date | null,
        private cancelledAt: Date | null,
    ) {
        super()
    }

    static create(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        position: number
    }): WaitlistEntry {
        return new WaitlistEntry(
            params.id,
            params.scheduleId,
            params.userId,
            params.position,
            WaitlistStatus.waiting(),
            new Date(),
            null,
            null,
        )
    }

    static reconstruct(params: {
        id: string
        scheduleId: ScheduleId
        userId: UserId
        position: number
        status: WaitlistStatus
        registeredAt: Date
        promotedAt: Date | null
        cancelledAt: Date | null
    }): WaitlistEntry {
        return new WaitlistEntry(
            params.id,
            params.scheduleId,
            params.userId,
            params.position,
            params.status,
            params.registeredAt,
            params.promotedAt,
            params.cancelledAt,
        )
    }

    promote(): void {
        if (!this.status.isWaiting()) {
            throw new DomainValidationError(
                'WAITING 状態のエントリーのみ繰り上げ可能です',
                'WAITLIST_NOT_WAITING'
            )
        }
        this.status = WaitlistStatus.promoted()
        this.promotedAt = new Date()
    }

    cancel(): void {
        if (this.status.isCancelled()) {
            throw new DomainValidationError('すでに辞退済みです', 'WAITLIST_ALREADY_CANCELLED')
        }
        if (this.status.isPromoted()) {
            throw new DomainValidationError('繰り上げ済みのエントリーはキャンセルできません', 'WAITLIST_ALREADY_PROMOTED')
        }
        this.status = WaitlistStatus.cancelled()
        this.cancelledAt = new Date()
    }

    /** キャンセル済み or 繰り上げ済みエントリーを再度 WAITING に戻す */
    rejoin(newPosition: number): void {
        if (this.status.isWaiting()) {
            throw new DomainValidationError('WAITING 状態のエントリーは再登録できません', 'WAITLIST_ALREADY_WAITING')
        }
        this.status = WaitlistStatus.waiting()
        this.position = newPosition
        this.cancelledAt = null
        this.promotedAt = null
    }

    isWaiting(): boolean {
        return this.status.isWaiting()
    }

    getId(): string { return this.id }
    getScheduleId(): ScheduleId { return this.scheduleId }
    getUserId(): UserId { return this.userId }
    getPosition(): number { return this.position }
    getStatus(): WaitlistStatus { return this.status }
    getRegisteredAt(): Date { return this.registeredAt }
    getPromotedAt(): Date | null { return this.promotedAt }
    getCancelledAt(): Date | null { return this.cancelledAt }
}
