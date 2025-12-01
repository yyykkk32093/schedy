// domains/schedule/activity/domain/event/ActivityCancelledEvent.ts

import { ScheduleDomainEvent } from '@/domains/schedule/sharedSchedule/domain/event/ScheduleDomainEvent.js'

import { UserId } from "@/domains/sharedDomains/model/valueObject/UserId.js"
import { ActivityId } from "../model/valueObject/ActivityId.js"
import { ActivityTimeRange } from "../model/valueObject/ActivityTimeRange.js"
import { ActivityTitle } from "../model/valueObject/ActivityTitle.js"

export class ActivityCancelledEvent extends ScheduleDomainEvent {
    readonly activityId: string
    readonly title: string
    readonly startAt: Date
    readonly endAt: Date
    readonly cancelledBy: string
    readonly cancelledAt: Date

    constructor(
        id: ActivityId,
        title: ActivityTitle,
        timeRange: ActivityTimeRange,
        cancelledBy: UserId
    ) {
        super("ActivityCancelledEvent", id.getValue())

        this.activityId = id.getValue()
        this.title = title.getValue()
        this.startAt = timeRange.startAt
        this.endAt = timeRange.endAt
        this.cancelledBy = cancelledBy.getValue()
        this.cancelledAt = new Date() // イベント発生時刻
    }
}
