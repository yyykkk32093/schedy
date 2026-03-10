import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

export type UserPlanType = 'FREE' | 'SUBSCRIBER' | 'LIFETIME'

const VALID_PLANS: readonly UserPlanType[] = ['FREE', 'SUBSCRIBER', 'LIFETIME'] as const

export class UserPlan extends ValueObject<UserPlanType> {
    private constructor(value: UserPlanType) {
        super(value)
    }

    static create(value?: string): UserPlan {
        const plan = (value ?? 'FREE').toUpperCase()

        if (!VALID_PLANS.includes(plan as UserPlanType)) {
            throw new DomainValidationError(
                `Invalid UserPlan: ${plan}`,
                'INVALID_USER_PLAN',
            )
        }
        return new UserPlan(plan as UserPlanType)
    }

    static reconstruct(value: string): UserPlan {
        return UserPlan.create(value)
    }

    isFree(): boolean {
        return this.getValue() === 'FREE'
    }

    isSubscriber(): boolean {
        return this.getValue() === 'SUBSCRIBER'
    }

    isLifetime(): boolean {
        return this.getValue() === 'LIFETIME'
    }

    /** SUBSCRIBER または LIFETIME なら true（有料プラン判定） */
    isPaid(): boolean {
        return !this.isFree()
    }
}
