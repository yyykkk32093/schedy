import type { Prisma, PrismaClient } from '@prisma/client'
import type {
    CommunityGradeFeaturePolicyRow,
    CommunityGradeLimitPolicyRow,
    IRestrictionRepository,
    PlanFeaturePolicyRow,
    PlanLimitPolicyRow,
} from '../../domain/repository/IRestrictionRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class RestrictionRepositoryImpl implements IRestrictionRepository {
    constructor(private readonly db: PrismaClientLike) { }

    async findPlanFeaturePolicies(): Promise<PlanFeaturePolicyRow[]> {
        const rows = await this.db.planFeaturePolicy.findMany()
        return rows.map(r => ({ plan: r.plan, feature: r.feature, enabled: r.enabled }))
    }

    async findPlanLimitPolicies(): Promise<PlanLimitPolicyRow[]> {
        const rows = await this.db.planLimitPolicy.findMany()
        return rows.map(r => ({ plan: r.plan, limitKey: r.limitKey, value: r.value }))
    }

    async findCommunityGradeFeaturePolicies(): Promise<CommunityGradeFeaturePolicyRow[]> {
        const rows = await this.db.communityGradeFeaturePolicy.findMany()
        return rows.map(r => ({ grade: r.grade, feature: r.feature, enabled: r.enabled }))
    }

    async findCommunityGradeLimitPolicies(): Promise<CommunityGradeLimitPolicyRow[]> {
        const rows = await this.db.communityGradeLimitPolicy.findMany()
        return rows.map(r => ({ grade: r.grade, limitKey: r.limitKey, value: r.value }))
    }
}
