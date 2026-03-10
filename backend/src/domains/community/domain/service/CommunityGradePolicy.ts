import { UserPlan } from '@/domains/user/domain/model/valueObject/UserPlan.js'
import { CommunityGrade } from '../model/valueObject/CommunityGrade.js'

/**
 * CommunityGradePolicy
 *
 * OWNER の UserPlan と Community の CommunityGrade を連動させるドメインサービス。
 * - SUBSCRIBER / LIFETIME → PREMIUM
 * - FREE → FREE
 * - OWNER 移譲時: 新 OWNER の plan に基づいて grade を再評価
 */
export class CommunityGradePolicy {
    /**
     * UserPlan から CommunityGrade を決定する。
     */
    static gradeFromPlan(plan: UserPlan): CommunityGrade {
        return plan.isPaid()
            ? CommunityGrade.premium()
            : CommunityGrade.free()
    }
}
