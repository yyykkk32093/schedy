import type { CommunityFeatureType, CommunityLimitKeyType } from '@/domains/_sharedDomains/featureGate/CommunityFeature.js'
import type { UserFeatureType, UserLimitKeyType } from '@/domains/_sharedDomains/featureGate/UserFeature.js'
import { PrismaClient } from '@prisma/client'

/**
 * FeatureGateService — DB → インメモリキャッシュ → 判定
 *
 * 制御の流れ (memo.md §6):
 *   DB (Restriction テーブル)
 *     → バックエンド (FeatureGate + インメモリキャッシュ)
 *       → API middleware (requireFeature → 403返却)
 *       → GET /v1/auth/me レスポンス (features/limits を含む)
 *         → フロント (UI表示制御: 🔒アイコン、グレーアウト等)
 */
export class FeatureGateService {
    private userFeatureCache: Map<string, boolean> = new Map()
    private userLimitCache: Map<string, number> = new Map()
    private communityFeatureCache: Map<string, boolean> = new Map()
    private communityLimitCache: Map<string, number> = new Map()

    private lastRefreshedAt: number = 0
    private readonly cacheTTLMs: number

    constructor(
        private readonly prisma: PrismaClient,
        cacheTTLMs: number = 5 * 60 * 1000, // default 5 minutes
    ) {
        this.cacheTTLMs = cacheTTLMs
    }

    // ============================================================
    // Public API — ユーザープラン制限
    // ============================================================

    /**
     * ユーザープランで機能が有効か
     */
    async canUse(plan: string, feature: UserFeatureType): Promise<boolean> {
        await this.ensureCache()
        return this.userFeatureCache.get(this.uKey(plan, feature)) ?? false
    }

    /**
     * ユーザープランの数量上限を取得（-1 = 無制限）
     */
    async getLimit(plan: string, limitKey: UserLimitKeyType): Promise<number> {
        await this.ensureCache()
        return this.userLimitCache.get(this.uLimitKey(plan, limitKey)) ?? 0
    }

    /**
     * ユーザープランで許可されている全Feature一覧
     */
    async getUserFeatures(plan: string): Promise<Record<string, boolean>> {
        await this.ensureCache()
        const result: Record<string, boolean> = {}
        for (const [key, enabled] of this.userFeatureCache) {
            if (key.startsWith(`${plan}:`)) {
                const feature = key.slice(plan.length + 1)
                result[feature] = enabled
            }
        }
        return result
    }

    /**
     * ユーザープランの全Limit一覧
     */
    async getUserLimits(plan: string): Promise<Record<string, number>> {
        await this.ensureCache()
        const result: Record<string, number> = {}
        for (const [key, value] of this.userLimitCache) {
            if (key.startsWith(`${plan}:`)) {
                const limitKey = key.slice(plan.length + 1)
                result[limitKey] = value
            }
        }
        return result
    }

    // ============================================================
    // Public API — コミュニティグレード制限
    // ============================================================

    /**
     * コミュニティグレードで機能が有効か
     */
    async canUseCommunity(
        grade: string,
        feature: CommunityFeatureType,
    ): Promise<boolean> {
        await this.ensureCache()
        return this.communityFeatureCache.get(this.cKey(grade, feature)) ?? false
    }

    /**
     * コミュニティグレードの数量上限を取得（-1 = 無制限）
     */
    async getCommunityLimit(
        grade: string,
        limitKey: CommunityLimitKeyType,
    ): Promise<number> {
        await this.ensureCache()
        return this.communityLimitCache.get(this.cLimitKey(grade, limitKey)) ?? 0
    }

    /**
     * コミュニティグレードの全Feature一覧
     */
    async getCommunityFeatures(
        grade: string,
    ): Promise<Record<string, boolean>> {
        await this.ensureCache()
        const result: Record<string, boolean> = {}
        for (const [key, enabled] of this.communityFeatureCache) {
            if (key.startsWith(`${grade}:`)) {
                const feature = key.slice(grade.length + 1)
                result[feature] = enabled
            }
        }
        return result
    }

    /**
     * コミュニティグレードの全Limit一覧
     */
    async getCommunityLimits(
        grade: string,
    ): Promise<Record<string, number>> {
        await this.ensureCache()
        const result: Record<string, number> = {}
        for (const [key, value] of this.communityLimitCache) {
            if (key.startsWith(`${grade}:`)) {
                const limitKey = key.slice(grade.length + 1)
                result[limitKey] = value
            }
        }
        return result
    }

    // ============================================================
    // Cache management
    // ============================================================

    /**
     * 強制的にキャッシュをリフレッシュ（DB変更後に呼ぶ）
     */
    async refreshCache(): Promise<void> {
        const [userFeatures, userLimits, communityFeatures, communityLimits] =
            await Promise.all([
                this.prisma.userFeatureRestriction.findMany(),
                this.prisma.userLimitRestriction.findMany(),
                this.prisma.communityFeatureRestriction.findMany(),
                this.prisma.communityLimitRestriction.findMany(),
            ])

        const newUserFeatureCache = new Map<string, boolean>()
        for (const row of userFeatures) {
            newUserFeatureCache.set(this.uKey(row.plan, row.feature), row.enabled)
        }

        const newUserLimitCache = new Map<string, number>()
        for (const row of userLimits) {
            newUserLimitCache.set(this.uLimitKey(row.plan, row.limitKey), row.value)
        }

        const newCommunityFeatureCache = new Map<string, boolean>()
        for (const row of communityFeatures) {
            newCommunityFeatureCache.set(
                this.cKey(row.grade, row.feature),
                row.enabled,
            )
        }

        const newCommunityLimitCache = new Map<string, number>()
        for (const row of communityLimits) {
            newCommunityLimitCache.set(
                this.cLimitKey(row.grade, row.limitKey),
                row.value,
            )
        }

        // Atomic swap
        this.userFeatureCache = newUserFeatureCache
        this.userLimitCache = newUserLimitCache
        this.communityFeatureCache = newCommunityFeatureCache
        this.communityLimitCache = newCommunityLimitCache
        this.lastRefreshedAt = Date.now()
    }

    // ============================================================
    // Private helpers
    // ============================================================

    private async ensureCache(): Promise<void> {
        if (Date.now() - this.lastRefreshedAt > this.cacheTTLMs) {
            await this.refreshCache()
        }
    }

    private uKey(plan: string, feature: string): string {
        return `${plan}:${feature}`
    }

    private uLimitKey(plan: string, limitKey: string): string {
        return `${plan}:${limitKey}`
    }

    private cKey(grade: string, feature: string): string {
        return `${grade}:${feature}`
    }

    private cLimitKey(grade: string, limitKey: string): string {
        return `${grade}:${limitKey}`
    }
}
