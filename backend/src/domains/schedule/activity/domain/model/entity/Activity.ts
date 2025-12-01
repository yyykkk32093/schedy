// domains/schedule/activity/domain/model/entity/Activity.ts

import { AggregateRoot } from '@/domains/sharedDomains/model/entity/AggregateRoot.js'
import { ActivityCreatedEvent } from '../../event/ActivityCreatedEvent.js'

import { UserId } from '@/domains/sharedDomains/model/valueObject/UserId.js'
import { ActivityCancelledEvent } from '../../event/ActivityCancelledEvent.js'
import { ActivityDescription } from '../valueObject/ActivityDescription.js'
import { ActivityId } from '../valueObject/ActivityId.js'
import { ActivityLocation } from '../valueObject/ActivityLocation.js'
import { ActivityTimeRange } from '../valueObject/ActivityTimeRange.js'
import { ActivityTitle } from '../valueObject/ActivityTitle.js'

export type ActivityStatus = 'ACTIVE' | 'CANCELLED'

export class Activity extends AggregateRoot {

    private constructor(
        private readonly id: ActivityId,
        private title: ActivityTitle,
        private description: ActivityDescription | null,
        private timeRange: ActivityTimeRange,
        private location: ActivityLocation | null,
        private createdBy: UserId,
        private status: ActivityStatus,
    ) {
        super()
    }

    // -------------------------
    // Factory（新規作成）
    // -------------------------
    static create(params: {
        id: ActivityId
        title: ActivityTitle
        description?: ActivityDescription | null
        timeRange: ActivityTimeRange
        location?: ActivityLocation | null
        createdBy: UserId
    }): Activity {

        const activity = new Activity(
            params.id,
            params.title,
            params.description ?? null,
            params.timeRange,
            params.location ?? null,
            params.createdBy,
            'ACTIVE'
        )

        activity.addDomainEvent(
            new ActivityCreatedEvent(
                activity.id,
                activity.title,
                activity.timeRange,
                activity.createdBy
            )
        )

        return activity
    }

    // -------------------------
    // Behavior（ふるまい）
    // -------------------------

    updateDetails(params: {
        title?: ActivityTitle
        description?: ActivityDescription | null
        timeRange?: ActivityTimeRange
        location?: ActivityLocation | null
    }) {
        if (params.title) this.title = params.title
        if (params.description !== undefined) this.description = params.description
        if (params.timeRange) this.timeRange = params.timeRange
        if (params.location !== undefined) this.location = params.location
    }

    cancel(by: UserId) {
        this.status = 'CANCELLED'

        this.addDomainEvent(
            new ActivityCancelledEvent(
                this.id,
                this.title,
                this.timeRange,
                by
            )
        )
    }

    static reconstruct(params: {
        id: ActivityId
        title: ActivityTitle
        description: ActivityDescription | null
        timeRange: ActivityTimeRange
        location: ActivityLocation | null
        createdBy: UserId
        status: ActivityStatus
    }): Activity {
        return new Activity(
            params.id,
            params.title,
            params.description,
            params.timeRange,
            params.location,
            params.createdBy,
            params.status
        )
    }

    // -------------------------
    // Getter（VO をそのまま返す）
    // -------------------------

    getId() { return this.id }
    getTitle() { return this.title }
    getDescription() { return this.description }
    getTimeRange() { return this.timeRange }
    getLocation() { return this.location }
    getCreatedBy() { return this.createdBy }
    getStatus() { return this.status }
}
