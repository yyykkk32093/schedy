import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_GRADES = ['FREE', 'PREMIUM'] as const
export type CommunityGradeType = (typeof VALID_GRADES)[number]

export class CommunityGrade extends ValueObject<CommunityGradeType> {
    private constructor(value: CommunityGradeType) {
        super(value)
    }

    static create(value: string): CommunityGrade {
        if (!VALID_GRADES.includes(value as CommunityGradeType)) {
            throw new DomainValidationError(
                `無効なコミュニティグレードです: ${value}`,
                'INVALID_COMMUNITY_GRADE'
            )
        }
        return new CommunityGrade(value as CommunityGradeType)
    }

    static reconstruct(value: string): CommunityGrade {
        return new CommunityGrade(value as CommunityGradeType)
    }

    static free(): CommunityGrade {
        return new CommunityGrade('FREE')
    }

    static premium(): CommunityGrade {
        return new CommunityGrade('PREMIUM')
    }

    isFree(): boolean {
        return this.value === 'FREE'
    }

    isPremium(): boolean {
        return this.value === 'PREMIUM'
    }
}
