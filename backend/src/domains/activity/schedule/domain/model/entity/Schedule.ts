import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { ActivityId } from '@/domains/activity/domain/model/valueObject/ActivityId.js'
import { TimeOfDay } from '@/domains/activity/domain/model/valueObject/TimeOfDay.js'
import { ScheduleCapacity } from '../valueObject/ScheduleCapacity.js'
import { ScheduleId } from '../valueObject/ScheduleId.js'
import { ScheduleStatus } from '../valueObject/ScheduleStatus.js'

/**
 * Schedule: 具体的な1回の予定。
 * - Activity に紐づく
 * - date + startTime + endTime で日時を表す
 * - status: SCHEDULED | CANCELLED
 * - capacity: 定員（null = 上限なし）
 * - isFull は参加者数との比較で算出（Schedule 自体は参加者数を持たない）
 */
export class Schedule extends AggregateRoot {
    private constructor(
        private readonly id: ScheduleId,
        private readonly activityId: ActivityId,
        private date: Date,
        private startTime: TimeOfDay,
        private endTime: TimeOfDay,
        private location: string | null,
        private note: string | null,
        private status: ScheduleStatus,
        private capacity: ScheduleCapacity,
        private participationFee: number | null,
    ) {
        super()
    }

    static create(params: {
        id: ScheduleId
        activityId: ActivityId
        date: Date
        startTime: TimeOfDay
        endTime: TimeOfDay
        location?: string | null
        note?: string | null
        capacity?: number | null
        participationFee?: number | null
    }): Schedule {
        if (!params.startTime.isBefore(params.endTime)) {
            throw new DomainValidationError(
                '開始時刻は終了時刻より前にしてください',
                'INVALID_SCHEDULE_TIME_RANGE'
            )
        }

        return new Schedule(
            params.id,
            params.activityId,
            params.date,
            params.startTime,
            params.endTime,
            params.location ?? null,
            params.note ?? null,
            ScheduleStatus.scheduled(),
            ScheduleCapacity.createNullable(params.capacity),
            params.participationFee ?? null,
        )
    }

    static reconstruct(params: {
        id: ScheduleId
        activityId: ActivityId
        date: Date
        startTime: TimeOfDay
        endTime: TimeOfDay
        location: string | null
        note: string | null
        status: ScheduleStatus
        capacity: ScheduleCapacity
        participationFee: number | null
    }): Schedule {
        return new Schedule(
            params.id,
            params.activityId,
            params.date,
            params.startTime,
            params.endTime,
            params.location,
            params.note,
            params.status,
            params.capacity,
            params.participationFee,
        )
    }

    // ---- Behavior ----

    update(params: {
        date?: Date
        startTime?: TimeOfDay
        endTime?: TimeOfDay
        location?: string | null
        note?: string | null
        capacity?: number | null
        participationFee?: number | null
    }): void {
        if (this.isCancelled()) {
            throw new DomainValidationError('キャンセル済みスケジュールは更新できません', 'SCHEDULE_ALREADY_CANCELLED')
        }
        if (params.date !== undefined) this.date = params.date
        if (params.startTime !== undefined) this.startTime = params.startTime
        if (params.endTime !== undefined) this.endTime = params.endTime
        if (params.location !== undefined) this.location = params.location
        if (params.note !== undefined) this.note = params.note
        if (params.capacity !== undefined) this.capacity = ScheduleCapacity.create(params.capacity)
        if (params.participationFee !== undefined) this.participationFee = params.participationFee

        // 更新後の整合性チェック
        if (!this.startTime.isBefore(this.endTime)) {
            throw new DomainValidationError(
                '開始時刻は終了時刻より前にしてください',
                'INVALID_SCHEDULE_TIME_RANGE'
            )
        }
    }

    cancel(): void {
        if (this.isCancelled()) {
            throw new DomainValidationError('すでにキャンセル済みです', 'SCHEDULE_ALREADY_CANCELLED')
        }
        this.status = ScheduleStatus.cancelled()
    }

    /**
     * 参加者数を受け取って定員に達しているか判定。
     * capacity が null（上限なし）なら常に false。
     */
    isFull(currentAttendingCount: number): boolean {
        const cap = this.capacity.getValue()
        if (cap === null) return false
        return currentAttendingCount >= cap
    }

    isCancelled(): boolean {
        return this.status.isCancelled()
    }

    // ---- Query ----

    getId(): ScheduleId { return this.id }
    getActivityId(): ActivityId { return this.activityId }
    getDate(): Date { return this.date }
    getStartTime(): TimeOfDay { return this.startTime }
    getEndTime(): TimeOfDay { return this.endTime }
    getLocation(): string | null { return this.location }
    getNote(): string | null { return this.note }
    getStatus(): ScheduleStatus { return this.status }
    getCapacity(): ScheduleCapacity { return this.capacity }
    getParticipationFee(): number | null { return this.participationFee }
}
