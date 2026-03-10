import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { ValueObject } from '@/domains/_sharedDomains/model/valueObject/ValueObject.js'

const VALID_STATUSES = ['WAITING', 'PROMOTED', 'CANCELLED'] as const
export type WaitlistStatusType = (typeof VALID_STATUSES)[number]

export class WaitlistStatus extends ValueObject<WaitlistStatusType> {
    private constructor(value: WaitlistStatusType) {
        super(value)
    }

    static create(value: string): WaitlistStatus {
        if (!VALID_STATUSES.includes(value as WaitlistStatusType)) {
            throw new DomainValidationError(
                `無効なキャンセル待ちステータスです: ${value}`,
                'INVALID_WAITLIST_STATUS'
            )
        }
        return new WaitlistStatus(value as WaitlistStatusType)
    }

    static waiting(): WaitlistStatus {
        return new WaitlistStatus('WAITING')
    }

    static promoted(): WaitlistStatus {
        return new WaitlistStatus('PROMOTED')
    }

    static cancelled(): WaitlistStatus {
        return new WaitlistStatus('CANCELLED')
    }

    static reconstruct(value: string): WaitlistStatus {
        return new WaitlistStatus(value as WaitlistStatusType)
    }

    isWaiting(): boolean {
        return this.value === 'WAITING'
    }

    isPromoted(): boolean {
        return this.value === 'PROMOTED'
    }

    isCancelled(): boolean {
        return this.value === 'CANCELLED'
    }
}
