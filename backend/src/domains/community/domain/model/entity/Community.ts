import { DomainValidationError } from '@/domains/_sharedDomains/error/DomainValidationError.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityCreatedEvent } from '../../../event/CommunityCreatedEvent.js'
import { CommunityDescription } from '../valueObject/CommunityDescription.js'
import { CommunityGrade } from '../valueObject/CommunityGrade.js'
import { CommunityId } from '../valueObject/CommunityId.js'
import { CommunityName } from '../valueObject/CommunityName.js'
import { JoinMethod } from '../valueObject/JoinMethod.js'

export class Community extends AggregateRoot {
    private static readonly MAX_DEPTH = 3

    private constructor(
        private readonly id: CommunityId,
        private name: CommunityName,
        private description: CommunityDescription | null,
        private logoUrl: string | null,
        private coverUrl: string | null,
        private readonly parentId: CommunityId | null,
        private readonly depth: number,
        private grade: CommunityGrade,
        private readonly createdBy: UserId,
        private deletedAt: Date | null,
        // ---- Phase 2: Community Profile Fields ----
        private communityTypeId: string | null,
        private joinMethod: JoinMethod,
        private isPublic: boolean,
        private maxMembers: number | null,
        private mainActivityArea: string | null,
        private activityFrequency: string | null,
        private nearestStation: string | null,
        private targetGender: string | null,
        private ageRange: string | null,
        // UBL-8: Payment settings
        private payPayId: string | null,
        private enabledPaymentMethods: string[],
        // Phase 3: Notification settings
        private reminderEnabled: boolean,
        private cancellationAlertEnabled: boolean,
    ) {
        super()
    }

    /**
     * 新規作成ファクトリ。トップレベルコミュニティ（parentId = null）を生成する。
     */
    static create(params: {
        id: CommunityId
        name: CommunityName
        description?: CommunityDescription | null
        grade?: CommunityGrade
        createdBy: UserId
        communityTypeId?: string | null
        joinMethod?: JoinMethod
        isPublic?: boolean
        maxMembers?: number | null
        mainActivityArea?: string | null
        activityFrequency?: string | null
        nearestStation?: string | null
        targetGender?: string | null
        ageRange?: string | null
    }): Community {
        const isPublic = params.isPublic ?? true
        const joinMethod = isPublic
            ? (params.joinMethod ?? JoinMethod.freeJoin())
            : JoinMethod.invitation()

        const community = new Community(
            params.id,
            params.name,
            params.description ?? null,
            null,       // logoUrl
            null,       // coverUrl
            null,       // parentId: トップレベル
            0,          // depth: 0
            params.grade ?? CommunityGrade.free(),
            params.createdBy,
            null,       // deletedAt
            params.communityTypeId ?? null,
            joinMethod,
            isPublic,
            params.maxMembers ?? null,
            params.mainActivityArea ?? null,
            params.activityFrequency ?? null,
            params.nearestStation ?? null,
            params.targetGender ?? null,
            params.ageRange ?? null,
            null,       // payPayId
            ['CASH'],   // enabledPaymentMethods
            true,       // reminderEnabled
            true,       // cancellationAlertEnabled
        )
        community.addDomainEvent(
            new CommunityCreatedEvent({
                communityId: params.id,
                name: params.name,
                createdBy: params.createdBy,
            })
        )
        return community
    }

    /**
     * 子コミュニティ作成ファクトリ（将来の階層対応用）。
     */
    static createChild(params: {
        id: CommunityId
        name: CommunityName
        description?: CommunityDescription | null
        grade?: CommunityGrade
        parentId: CommunityId
        parentDepth: number
        createdBy: UserId
        communityTypeId?: string | null
        joinMethod?: JoinMethod
        isPublic?: boolean
        maxMembers?: number | null
        mainActivityArea?: string | null
        activityFrequency?: string | null
        nearestStation?: string | null
        targetGender?: string | null
        ageRange?: string | null
    }): Community {
        const childDepth = params.parentDepth + 1
        if (childDepth > Community.MAX_DEPTH) {
            throw new DomainValidationError(
                `コミュニティの階層は最大${Community.MAX_DEPTH}階層までです`,
                'COMMUNITY_MAX_DEPTH_EXCEEDED'
            )
        }
        const isPublic = params.isPublic ?? true
        const joinMethod = isPublic
            ? (params.joinMethod ?? JoinMethod.freeJoin())
            : JoinMethod.invitation()

        const community = new Community(
            params.id,
            params.name,
            params.description ?? null,
            null,       // logoUrl
            null,       // coverUrl
            params.parentId,
            childDepth,
            params.grade ?? CommunityGrade.free(),
            params.createdBy,
            null,
            params.communityTypeId ?? null,
            joinMethod,
            isPublic,
            params.maxMembers ?? null,
            params.mainActivityArea ?? null,
            params.activityFrequency ?? null,
            params.nearestStation ?? null,
            params.targetGender ?? null,
            params.ageRange ?? null,
            null,       // payPayId
            ['CASH'],   // enabledPaymentMethods
            true,       // reminderEnabled
            true,       // cancellationAlertEnabled
        )
        community.addDomainEvent(
            new CommunityCreatedEvent({
                communityId: params.id,
                name: params.name,
                createdBy: params.createdBy,
            })
        )
        return community
    }

    /**
     * DB復元ファクトリ
     */
    static reconstruct(params: {
        id: CommunityId
        name: CommunityName
        description: CommunityDescription | null
        logoUrl: string | null
        coverUrl: string | null
        parentId: CommunityId | null
        depth: number
        grade: CommunityGrade
        createdBy: UserId
        deletedAt: Date | null
        communityTypeId: string | null
        joinMethod: JoinMethod
        isPublic: boolean
        maxMembers: number | null
        mainActivityArea: string | null
        activityFrequency: string | null
        nearestStation: string | null
        targetGender: string | null
        ageRange: string | null
        payPayId: string | null
        enabledPaymentMethods: string[]
        reminderEnabled: boolean
        cancellationAlertEnabled: boolean
    }): Community {
        return new Community(
            params.id,
            params.name,
            params.description,
            params.logoUrl,
            params.coverUrl,
            params.parentId,
            params.depth,
            params.grade,
            params.createdBy,
            params.deletedAt,
            params.communityTypeId,
            params.joinMethod,
            params.isPublic,
            params.maxMembers,
            params.mainActivityArea,
            params.activityFrequency,
            params.nearestStation,
            params.targetGender,
            params.ageRange,
            params.payPayId,
            params.enabledPaymentMethods,
            params.reminderEnabled,
            params.cancellationAlertEnabled,
        )
    }

    // ---- Behavior ----

    update(params: {
        name?: CommunityName
        description?: CommunityDescription | null
        logoUrl?: string | null
        coverUrl?: string | null
        communityTypeId?: string | null
        joinMethod?: JoinMethod
        isPublic?: boolean
        maxMembers?: number | null
        mainActivityArea?: string | null
        activityFrequency?: string | null
        nearestStation?: string | null
        targetGender?: string | null
        ageRange?: string | null
        payPayId?: string | null
        enabledPaymentMethods?: string[]
        reminderEnabled?: boolean
        cancellationAlertEnabled?: boolean
    }): void {
        if (this.isDeleted()) {
            throw new DomainValidationError('削除済みコミュニティは更新できません', 'COMMUNITY_ALREADY_DELETED')
        }
        if (params.name) this.name = params.name
        if (params.description !== undefined) this.description = params.description
        if (params.logoUrl !== undefined) this.logoUrl = params.logoUrl
        if (params.coverUrl !== undefined) this.coverUrl = params.coverUrl
        if (params.communityTypeId !== undefined) this.communityTypeId = params.communityTypeId
        if (params.isPublic !== undefined) {
            this.isPublic = params.isPublic
            if (!params.isPublic) {
                this.joinMethod = JoinMethod.invitation()
            }
        }
        if (params.joinMethod !== undefined && this.isPublic) this.joinMethod = params.joinMethod
        if (params.maxMembers !== undefined) this.maxMembers = params.maxMembers
        if (params.mainActivityArea !== undefined) this.mainActivityArea = params.mainActivityArea
        if (params.activityFrequency !== undefined) this.activityFrequency = params.activityFrequency
        if (params.nearestStation !== undefined) this.nearestStation = params.nearestStation
        if (params.targetGender !== undefined) this.targetGender = params.targetGender
        if (params.ageRange !== undefined) this.ageRange = params.ageRange
        if (params.payPayId !== undefined) this.payPayId = params.payPayId
        if (params.enabledPaymentMethods !== undefined) this.enabledPaymentMethods = params.enabledPaymentMethods
        if (params.reminderEnabled !== undefined) this.reminderEnabled = params.reminderEnabled
        if (params.cancellationAlertEnabled !== undefined) this.cancellationAlertEnabled = params.cancellationAlertEnabled
    }

    softDelete(): void {
        if (this.isDeleted()) {
            throw new DomainValidationError('すでに削除済みです', 'COMMUNITY_ALREADY_DELETED')
        }
        this.deletedAt = new Date()
    }

    changeGrade(newGrade: CommunityGrade): void {
        if (this.isDeleted()) {
            throw new DomainValidationError('削除済みコミュニティのグレードは変更できません', 'COMMUNITY_ALREADY_DELETED')
        }
        this.grade = newGrade
    }

    // ---- Query ----

    isDeleted(): boolean {
        return this.deletedAt !== null
    }

    getId(): CommunityId { return this.id }
    getName(): CommunityName { return this.name }
    getDescription(): CommunityDescription | null { return this.description }
    getLogoUrl(): string | null { return this.logoUrl }
    getCoverUrl(): string | null { return this.coverUrl }
    getParentId(): CommunityId | null { return this.parentId }
    getDepth(): number { return this.depth }
    getGrade(): CommunityGrade { return this.grade }
    getCreatedBy(): UserId { return this.createdBy }
    getDeletedAt(): Date | null { return this.deletedAt }
    getCommunityTypeId(): string | null { return this.communityTypeId }
    getJoinMethod(): JoinMethod { return this.joinMethod }
    getIsPublic(): boolean { return this.isPublic }
    getMaxMembers(): number | null { return this.maxMembers }
    getMainActivityArea(): string | null { return this.mainActivityArea }
    getActivityFrequency(): string | null { return this.activityFrequency }
    getNearestStation(): string | null { return this.nearestStation }
    getTargetGender(): string | null { return this.targetGender }
    getAgeRange(): string | null { return this.ageRange }
    getPayPayId(): string | null { return this.payPayId }
    getEnabledPaymentMethods(): string[] { return this.enabledPaymentMethods }
    getReminderEnabled(): boolean { return this.reminderEnabled }
    getCancellationAlertEnabled(): boolean { return this.cancellationAlertEnabled }
}
