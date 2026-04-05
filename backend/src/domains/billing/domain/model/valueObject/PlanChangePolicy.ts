/**
 * PlanChangePolicy — プラン変更時のビジネスルール判定
 *
 * ダウングレード影響の評価と許可/拒否判定を行う。
 */

import type { UserPlan } from '@/domains/user/domain/model/valueObject/UserPlan.js'

export interface PlanChangeImpact {
    allowed: boolean
    reason?: string
    affectedCommunities: number
    /** ダウングレードで PREMIUM → FREE になるコミュニティ数 */
    downgradeCount: number
}

export class PlanChangePolicy {
    /**
     * FREE → SUBSCRIBER: 常に許可
     * SUBSCRIBER → FREE: PREMIUM コミュニティ OWNER がいる場合に警告
     * LIFETIME: 降格不可
     */
    static evaluate(params: {
        currentPlan: UserPlan
        newPlan: UserPlan
        ownedPremiumCommunityCount: number
    }): PlanChangeImpact {
        const { currentPlan, newPlan, ownedPremiumCommunityCount } = params

        // LIFETIME ユーザーは降格不可
        if (currentPlan.isLifetime() && !newPlan.isLifetime()) {
            return {
                allowed: false,
                reason: 'LIFETIME プランからの変更はできません',
                affectedCommunities: 0,
                downgradeCount: 0,
            }
        }

        // アップグレード: 常に許可
        if (currentPlan.isFree() && newPlan.isPaid()) {
            return {
                allowed: true,
                affectedCommunities: 0,
                downgradeCount: 0,
            }
        }

        // ダウングレード: SUBSCRIBER → FREE
        if (currentPlan.isSubscriber() && newPlan.isFree()) {
            return {
                allowed: true,
                reason: ownedPremiumCommunityCount > 0
                    ? `${ownedPremiumCommunityCount} 件のコミュニティが FREE グレードに変更されます`
                    : undefined,
                affectedCommunities: ownedPremiumCommunityCount,
                downgradeCount: ownedPremiumCommunityCount,
            }
        }

        // 同一プラン
        return { allowed: true, affectedCommunities: 0, downgradeCount: 0 }
    }
}
