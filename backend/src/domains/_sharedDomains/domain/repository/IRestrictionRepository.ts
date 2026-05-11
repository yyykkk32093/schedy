export type PlanFeaturePolicyRow = {
    plan: string
    feature: string
    enabled: boolean
}

export type PlanLimitPolicyRow = {
    plan: string
    limitKey: string
    value: number
}

export type CommunityGradeFeaturePolicyRow = {
    grade: string
    feature: string
    enabled: boolean
}

export type CommunityGradeLimitPolicyRow = {
    grade: string
    limitKey: string
    value: number
}

export interface IRestrictionRepository {
    findPlanFeaturePolicies(): Promise<PlanFeaturePolicyRow[]>
    findPlanLimitPolicies(): Promise<PlanLimitPolicyRow[]>
    findCommunityGradeFeaturePolicies(): Promise<CommunityGradeFeaturePolicyRow[]>
    findCommunityGradeLimitPolicies(): Promise<CommunityGradeLimitPolicyRow[]>
}
