import type { Activity } from '../model/entity/Activity.js'

export interface IActivityRepository {
    findById(id: string): Promise<Activity | null>
    findsByCommunityId(communityId: string): Promise<Activity[]>
    findByRecurrenceRuleNotNull(): Promise<Activity[]>
    save(activity: Activity): Promise<void>
}
