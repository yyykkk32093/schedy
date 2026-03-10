import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_STATUSES = ['ATTENDING', 'CANCELLED'] as const
export type ParticipationStatusType = (typeof VALID_STATUSES)[number]

export class ParticipationStatus extends ValueObject<ParticipationStatusType> {
    private constructor(value: ParticipationStatusType) {
        super(value)
    }

    static create(value: string): ParticipationStatus {
        if (!VALID_STATUSES.includes(value as ParticipationStatusType)) {
            throw new DomainValidationError(
                `無効な参加ステータスです: ${value}`,
                'INVALID_PARTICIPATION_STATUS'
            )
        }
        return new ParticipationStatus(value as ParticipationStatusType)
    }

    static attending(): ParticipationStatus {
        return new ParticipationStatus('ATTENDING')
    }

    static cancelled(): ParticipationStatus {
        return new ParticipationStatus('CANCELLED')
    }

    static reconstruct(value: string): ParticipationStatus {
        return new ParticipationStatus(value as ParticipationStatusType)
    }

    isAttending(): boolean {
        return this.value === 'ATTENDING'
    }

    isCancelled(): boolean {
        return this.value === 'CANCELLED'
    }
}
