// src/domains/user/domain/model/entity/User.ts

import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'
import { EmailAddress } from '@/domains/_sharedDomains/model/valueObject/EmailAddress.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { UserRegisteredEvent } from '../../event/UserRegisteredEvent.js'
import { AvatarUrl } from '../valueObject/AvatarUrl.js'
import { Biography } from '../valueObject/Biography.js'
import { DisplayName } from '../valueObject/DisplayName.js'
import { PhoneNumber } from '../valueObject/PhoneNumber.js'
import { QuietHours, UserNotificationSetting } from '../valueObject/UserNotificationSetting.js'
import { UserRole } from '../valueObject/UserRole.js'

export class User extends AggregateRoot {

    private constructor(
        private readonly id: UserId,
        private displayName: DisplayName | null,
        private role: UserRole,
        private email: EmailAddress | null,
        private phone: PhoneNumber | null,
        private biography: Biography | null,
        private avatarUrl: AvatarUrl | null,
        private notificationSetting: UserNotificationSetting,
        private readonly createdAt: Date,
        private updatedAt: Date
    ) {
        super()
    }

    // =====================================================
    // Factory: register（新規登録）
    // =====================================================
    static register(params: {
        userId: UserId
        email: EmailAddress
        displayName?: DisplayName | null
    }): User {

        const now = new Date()

        const user = new User(
            params.userId,
            params.displayName ?? null,
            UserRole.create('MEMBER'),
            params.email,
            null,
            null,
            null,
            UserNotificationSetting.create(),
            now,
            now
        )

        user.addDomainEvent(
            new UserRegisteredEvent({
                userId: params.userId,
                email: params.email,
            })
        )

        return user
    }

    // =====================================================
    // Factory: create
    // =====================================================
    static create(params: {
        id: string
        displayName?: string | null
        role?: UserRole
        email?: string | null
    }): User {
        const now = new Date()

        return new User(
            UserId.create(params.id),
            params.displayName ? DisplayName.create(params.displayName) : null,
            params.role ?? UserRole.create('MEMBER'),
            params.email ? EmailAddress.create(params.email) : null,
            null,
            null,
            null,
            UserNotificationSetting.create(),
            now,
            now
        )
    }

    // =====================================================
    // Factory: reconstruct（永続化復元）
    // =====================================================
    static reconstruct(params: {
        id: string
        displayName: string | null
        role: string
        email: string | null
        phone: string | null
        biography: string | null
        avatarUrl: string | null
        notification: {
            emailEnabled: boolean
            pushEnabled: boolean
            activityReminderEnabled: boolean
            quietHours: QuietHours | null
        }
        createdAt: Date
        updatedAt: Date
    }): User {

        return new User(
            UserId.create(params.id),
            params.displayName ? DisplayName.reconstruct(params.displayName) : null,
            UserRole.reconstruct(params.role),
            params.email ? EmailAddress.reconstruct(params.email) : null,
            params.phone ? PhoneNumber.reconstruct(params.phone) : null,
            params.biography ? Biography.reconstruct(params.biography) : null,
            params.avatarUrl ? AvatarUrl.reconstruct(params.avatarUrl) : null,
            UserNotificationSetting.reconstruct(params.notification),
            params.createdAt,
            params.updatedAt
        )
    }

    // =====================================================
    // Behavior
    // =====================================================

    updateProfile(profile: {
        displayName?: string | null
        email?: string | null
        phone?: string | null
        biography?: string | null
        avatarUrl?: string | null
    }) {
        if (profile.displayName !== undefined)
            this.displayName = profile.displayName
                ? DisplayName.create(profile.displayName)
                : null

        if (profile.email !== undefined)
            this.email = profile.email
                ? EmailAddress.create(profile.email)
                : null

        if (profile.phone !== undefined)
            this.phone = profile.phone
                ? PhoneNumber.create(profile.phone)
                : null

        if (profile.biography !== undefined)
            this.biography = profile.biography
                ? Biography.create(profile.biography)
                : null

        if (profile.avatarUrl !== undefined)
            this.avatarUrl = profile.avatarUrl
                ? AvatarUrl.create(profile.avatarUrl)
                : null

        this.updatedAt = new Date()
    }

    updateNotificationSetting(diff: Partial<{
        emailEnabled: boolean
        pushEnabled: boolean
        activityReminderEnabled: boolean
        quietHours: QuietHours | null
    }>) {
        this.notificationSetting = this.notificationSetting.update(diff)
        this.updatedAt = new Date()
    }

    changeRole(newRole: UserRole) {
        this.role = newRole
        this.updatedAt = new Date()
    }

    // =====================================================
    // Getter
    // =====================================================

    getId() { return this.id }
    getDisplayName() { return this.displayName }
    getEmail() { return this.email }
    getPhone() { return this.phone }
    getBiography() { return this.biography }
    getAvatarUrl() { return this.avatarUrl }
    getRole() { return this.role }
    getNotificationSetting() { return this.notificationSetting }
    getCreatedAt() { return this.createdAt }
    getUpdatedAt() { return this.updatedAt }
}
