// domains/schedule/activity/domain/event/ActivityCreatedEvent.ts
import { ScheduleDomainEvent } from '@/domains/schedule/sharedSchedule/domain/event/ScheduleDomainEvent.js'

import { UserId } from "@/domains/sharedDomains/model/valueObject/UserId.js"
import { ActivityId } from "../model/valueObject/ActivityId.js"
import { ActivityTimeRange } from "../model/valueObject/ActivityTimeRange.js"
import { ActivityTitle } from "../model/valueObject/ActivityTitle.js"

export class ActivityCreatedEvent extends ScheduleDomainEvent {
    readonly activityId: string
    readonly title: string
    readonly startAt: Date
    readonly endAt: Date
    readonly createdBy: string

    constructor(
        id: ActivityId,
        title: ActivityTitle,
        timeRange: ActivityTimeRange,
        createdBy: UserId
    ) {
        super("ActivityCreatedEvent", id.getValue())

        this.activityId = id.getValue()
        this.title = title.getValue()
        this.startAt = timeRange.startAt
        this.endAt = timeRange.endAt
        this.createdBy = createdBy.getValue()
    }

    readonly outcome = "SUCCESS"
}