import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_JOIN_METHODS = ['FREE_JOIN', 'APPROVAL', 'INVITATION'] as const
export type JoinMethodType = (typeof VALID_JOIN_METHODS)[number]

export class JoinMethod extends ValueObject<JoinMethodType> {
    private constructor(value: JoinMethodType) {
        super(value)
    }

    static create(value: string): JoinMethod {
        if (!VALID_JOIN_METHODS.includes(value as JoinMethodType)) {
            throw new DomainValidationError(
                `無効な参加方式です: ${value}`,
                'INVALID_JOIN_METHOD'
            )
        }
        return new JoinMethod(value as JoinMethodType)
    }

    static reconstruct(value: string): JoinMethod {
        return new JoinMethod(value as JoinMethodType)
    }

    static freeJoin(): JoinMethod {
        return new JoinMethod('FREE_JOIN')
    }

    static approval(): JoinMethod {
        return new JoinMethod('APPROVAL')
    }

    static invitation(): JoinMethod {
        return new JoinMethod('INVITATION')
    }

    isFreeJoin(): boolean {
        return this.value === 'FREE_JOIN'
    }

    isApproval(): boolean {
        return this.value === 'APPROVAL'
    }

    isInvitation(): boolean {
        return this.value === 'INVITATION'
    }
}
