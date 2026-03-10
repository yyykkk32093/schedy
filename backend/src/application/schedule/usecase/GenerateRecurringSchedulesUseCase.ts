import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { RecurrenceRule } from '@/domains/activity/domain/model/valueObject/RecurrenceRule.js'
import { TimeOfDay } from '@/domains/activity/domain/model/valueObject/TimeOfDay.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import { Schedule } from '@/domains/activity/schedule/domain/model/entity/Schedule.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'

/**
 * GenerateRecurringSchedulesUseCase — recurrenceRule を持つ Activity から
 * 今後 N 日間のスケジュールを自動生成する。
 *
 * 冪等: 同日 + 同 activityId のスケジュールが既にある場合はスキップする。
 */
export class GenerateRecurringSchedulesUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly activityRepository: IActivityRepository,
        private readonly scheduleRepository: IScheduleRepository,
    ) { }

    async execute(input: { daysAhead?: number } = {}): Promise<{ generatedCount: number }> {
        const daysAhead = input.daysAhead ?? 14
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const to = new Date(from.getTime() + daysAhead * 24 * 60 * 60 * 1000)

        // recurrenceRule が設定されている全 Activity を取得
        const activities = await this.activityRepository.findByRecurrenceRuleNotNull()

        let generatedCount = 0

        for (const activity of activities) {
            const ruleString = activity.getRecurrenceRule()
            if (!ruleString) continue

            const rule = RecurrenceRule.reconstruct(ruleString)
            const dates = rule.between(from, to)

            // 既存スケジュールを取得して重複チェック用に日付セットを作成
            const existingSchedules = await this.scheduleRepository.findsByActivityId(
                activity.getId().getValue(),
            )
            const existingDateSet = new Set(
                existingSchedules.map((s) => s.getDate().toISOString().slice(0, 10)),
            )

            for (const date of dates) {
                const dateKey = date.toISOString().slice(0, 10)
                if (existingDateSet.has(dateKey)) continue

                const scheduleId = ScheduleId.create(this.idGenerator.generate())
                const schedule = Schedule.create({
                    id: scheduleId,
                    activityId: activity.getId(),
                    date,
                    startTime: activity.getDefaultStartTime() ?? TimeOfDay.create('09:00'),
                    endTime: activity.getDefaultEndTime() ?? TimeOfDay.create('10:00'),
                    location: activity.getDefaultLocation()?.getValue() ?? null,
                })

                await this.scheduleRepository.save(schedule)
                generatedCount++
            }
        }

        return { generatedCount }
    }
}
