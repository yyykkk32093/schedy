import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import type { IActivityRepository } from '@/domains/activity/domain/repository/IActivityRepository.js'
import type { IScheduleRepository } from '@/domains/activity/schedule/domain/repository/IScheduleRepository.js'
import { RecurringScheduleGenerator } from '@/domains/activity/schedule/domain/service/RecurringScheduleGenerator.js'

/**
 * GenerateRecurringSchedulesUseCase — recurrenceRule を持つ Activity から
 * 今後のスケジュールを自動生成する（デフォルト2ヶ月先）。
 *
 * ドメインサービス RecurringScheduleGenerator に処理を委譲。
 * 冪等: 同日 + 同 activityId のスケジュールが既にある場合はスキップする。
 */
export class GenerateRecurringSchedulesUseCase {
    constructor(
        private readonly idGenerator: IIdGenerator,
        private readonly activityRepository: IActivityRepository,
        private readonly scheduleRepository: IScheduleRepository,
    ) { }

    async execute(): Promise<{ generatedCount: number }> {
        // recurrenceRule が設定されている全 Activity を取得
        const activities = await this.activityRepository.findByRecurrenceRuleNotNull()

        let generatedCount = 0

        for (const activity of activities) {
            if (!activity.getRecurrenceRule()) continue

            // 既存スケジュールを取得して重複チェック用に日付セットを作成
            const existingSchedules = await this.scheduleRepository.findsByActivityId(
                activity.getId().getValue(),
            )
            const existingDateSet = new Set(
                existingSchedules.map((s) => s.getDate().toISOString().slice(0, 10)),
            )

            const newSchedules = RecurringScheduleGenerator.generateSchedules(
                activity, existingDateSet, this.idGenerator,
            )

            if (newSchedules.length > 0) {
                await this.scheduleRepository.saveMany(newSchedules)
                generatedCount += newSchedules.length
            }
        }

        return { generatedCount }
    }
}
