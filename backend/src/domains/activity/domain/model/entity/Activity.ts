import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import { ActivityDescription } from '../valueObject/ActivityDescription.js'
import { ActivityId } from '../valueObject/ActivityId.js'
import { ActivityTitle } from '../valueObject/ActivityTitle.js'
import { DefaultLocation } from '../valueObject/DefaultLocation.js'
import { TimeOfDay } from '../valueObject/TimeOfDay.js'

/**
 * Activity: 「何をするか」＋「繰り返しパターン（あれば）」
 * - statusなし（論理削除: deletedAt）
 * - communityId で Community に紐づく
 * - Schedule の元となるデフォルト設定を持つ
 */
export class Activity extends AggregateRoot {
    private constructor(
        private readonly id: ActivityId,
        private readonly communityId: CommunityId,
        private title: ActivityTitle,
        private description: ActivityDescription | null,
        private defaultLocation: DefaultLocation | null,
        private defaultAddress: string | null,
        private defaultStartTime: TimeOfDay | null,
        private defaultEndTime: TimeOfDay | null,
        private recurrenceRule: string | null,
        private organizerUserId: UserId | null,
        private readonly createdBy: UserId,
        private deletedAt: Date | null,
    ) {
        super()
    }

    static create(params: {
        id: ActivityId
        communityId: CommunityId
        title: ActivityTitle
        description?: ActivityDescription | null
        defaultLocation?: DefaultLocation | null
        defaultAddress?: string | null
        defaultStartTime?: TimeOfDay | null
        defaultEndTime?: TimeOfDay | null
        recurrenceRule?: string | null
        organizerUserId?: UserId | null
        createdBy: UserId
    }): Activity {
        // startTime / endTime の整合性チェック
        if (params.defaultStartTime && params.defaultEndTime) {
            if (!params.defaultStartTime.isBefore(params.defaultEndTime)) {
                throw new DomainValidationError(
                    'デフォルト開始時刻はデフォルト終了時刻より前にしてください',
                    'INVALID_DEFAULT_TIME_RANGE'
                )
            }
        }

        return new Activity(
            params.id,
            params.communityId,
            params.title,
            params.description ?? null,
            params.defaultLocation ?? null,
            params.defaultAddress ?? null,
            params.defaultStartTime ?? null,
            params.defaultEndTime ?? null,
            params.recurrenceRule ?? null,
            params.organizerUserId ?? null,
            params.createdBy,
            null, // deletedAt
        )
    }

    static reconstruct(params: {
        id: ActivityId
        communityId: CommunityId
        title: ActivityTitle
        description: ActivityDescription | null
        defaultLocation: DefaultLocation | null
        defaultAddress: string | null
        defaultStartTime: TimeOfDay | null
        defaultEndTime: TimeOfDay | null
        recurrenceRule: string | null
        organizerUserId: UserId | null
        createdBy: UserId
        deletedAt: Date | null
    }): Activity {
        return new Activity(
            params.id,
            params.communityId,
            params.title,
            params.description,
            params.defaultLocation,
            params.defaultAddress,
            params.defaultStartTime,
            params.defaultEndTime,
            params.recurrenceRule,
            params.organizerUserId,
            params.createdBy,
            params.deletedAt,
        )
    }

    // ---- Behavior ----

    update(params: {
        title?: ActivityTitle
        description?: ActivityDescription | null
        defaultLocation?: DefaultLocation | null
        defaultAddress?: string | null
        defaultStartTime?: TimeOfDay | null
        defaultEndTime?: TimeOfDay | null
        recurrenceRule?: string | null
        organizerUserId?: UserId | null
    }): void {
        if (this.isDeleted()) {
            throw new DomainValidationError('削除済みアクティビティは更新できません', 'ACTIVITY_ALREADY_DELETED')
        }
        if (params.title) this.title = params.title
        if (params.description !== undefined) this.description = params.description
        if (params.defaultLocation !== undefined) this.defaultLocation = params.defaultLocation
        if (params.defaultAddress !== undefined) this.defaultAddress = params.defaultAddress
        if (params.defaultStartTime !== undefined) this.defaultStartTime = params.defaultStartTime
        if (params.defaultEndTime !== undefined) this.defaultEndTime = params.defaultEndTime
        if (params.recurrenceRule !== undefined) this.recurrenceRule = params.recurrenceRule
        if (params.organizerUserId !== undefined) this.organizerUserId = params.organizerUserId

        // 更新後の整合性チェック
        if (this.defaultStartTime && this.defaultEndTime) {
            if (!this.defaultStartTime.isBefore(this.defaultEndTime)) {
                throw new DomainValidationError(
                    'デフォルト開始時刻はデフォルト終了時刻より前にしてください',
                    'INVALID_DEFAULT_TIME_RANGE'
                )
            }
        }
    }

    softDelete(): void {
        if (this.isDeleted()) {
            throw new DomainValidationError('すでに削除済みです', 'ACTIVITY_ALREADY_DELETED')
        }
        this.deletedAt = new Date()
    }

    changeOrganizer(userId: UserId | null): void {
        if (this.isDeleted()) {
            throw new DomainValidationError('削除済みアクティビティは更新できません', 'ACTIVITY_ALREADY_DELETED')
        }
        this.organizerUserId = userId
    }

    // ---- Query ----

    isDeleted(): boolean {
        return this.deletedAt !== null
    }

    getId(): ActivityId { return this.id }
    getCommunityId(): CommunityId { return this.communityId }
    getTitle(): ActivityTitle { return this.title }
    getDescription(): ActivityDescription | null { return this.description }
    getDefaultLocation(): DefaultLocation | null { return this.defaultLocation }
    getDefaultAddress(): string | null { return this.defaultAddress }
    getDefaultStartTime(): TimeOfDay | null { return this.defaultStartTime }
    getDefaultEndTime(): TimeOfDay | null { return this.defaultEndTime }
    getRecurrenceRule(): string | null { return this.recurrenceRule }
    getOrganizerUserId(): UserId | null { return this.organizerUserId }
    getCreatedBy(): UserId { return this.createdBy }
    getDeletedAt(): Date | null { return this.deletedAt }
}
