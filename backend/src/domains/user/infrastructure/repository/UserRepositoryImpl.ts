import { prisma } from '@/_sharedTech/db/client.js'
import type { Prisma, PrismaClient } from '@prisma/client'

import { User } from '../../domain/model/entity/User.js'
import { IUserRepository } from '../../domain/repository/IUserRepository.js'

export class UserRepositoryImpl implements IUserRepository {

    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma
    ) { }

    // ============================================================
    // Find
    // ============================================================
    async findById(id: string): Promise<User | null> {
        const record = await this.db.user.findUnique({
            where: { id },
        })

        if (!record) return null
        return this.toDomain(record)
    }

    async findByEmail(email: string): Promise<User | null> {
        const record = await this.db.user.findUnique({
            where: { email },
        })

        if (!record) return null
        return this.toDomain(record)
    }

    // ============================================================
    // Save / Upsert
    // ============================================================
    async save(user: User): Promise<void> {

        const data = this.toPersistence(user)

        await this.db.user.upsert({
            where: { id: data.id },
            update: {
                displayName: data.displayName,
                role: data.role,
                email: data.email,
                phone: data.phone,
                biography: data.biography,
                avatarUrl: data.avatarUrl,
                notificationSetting: data.notificationSetting,
                updatedAt: new Date(),
            },
            create: {
                id: data.id,
                displayName: data.displayName,
                role: data.role,
                email: data.email,
                phone: data.phone,
                biography: data.biography,
                avatarUrl: data.avatarUrl,
                notificationSetting: data.notificationSetting,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            },
        })
    }

    // ============================================================
    // Domain → Persistence
    // ============================================================
    private toPersistence(user: User) {

        const n = user.getNotificationSetting().getValue()

        return {
            id: user.getId().getValue(),
            displayName: user.getDisplayName()?.getValue() ?? null,
            role: user.getRole().getValue(),
            email: user.getEmail()?.getValue() ?? null,
            phone: user.getPhone()?.getValue() ?? null,
            biography: user.getBiography()?.getValue() ?? null,
            avatarUrl: user.getAvatarUrl()?.getValue() ?? null,

            notificationSetting: {
                emailEnabled: n.emailEnabled,
                pushEnabled: n.pushEnabled,
                activityReminderEnabled: n.activityReminderEnabled,
                quietHours: n.quietHours,
            },

            createdAt: user.getCreatedAt(),
            updatedAt: user.getUpdatedAt(),
        }
    }

    // ============================================================
    // Persistence → Domain
    // ============================================================
    private toDomain(record: any): User {

        return User.reconstruct({
            id: record.id,
            displayName: record.displayName,
            role: record.role,
            email: record.email,
            phone: record.phone,
            biography: record.biography,
            avatarUrl: record.avatarUrl,

            notification: record.notificationSetting,

            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        })
    }
}
