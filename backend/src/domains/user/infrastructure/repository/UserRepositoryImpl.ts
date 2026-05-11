import { prisma } from '@/_sharedTech/db/client.js'
import type { Prisma, PrismaClient } from '@prisma/client'

import { User } from '../../domain/model/entity/User.js'
import { AuthMeView, IUserRepository, SystemAuthorizationView, UserPlanView } from '../../domain/repository/IUserRepository.js'

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

    async findByIds(ids: string[]): Promise<User[]> {
        if (ids.length === 0) return []
        const records = await this.db.user.findMany({
            where: { id: { in: ids } },
        })
        return records.map((r) => this.toDomain(r))
    }

    async findSystemAuthorization(id: string): Promise<SystemAuthorizationView | null> {
        const record = await this.db.user.findUnique({
            where: { id },
            select: { systemRole: true, deletedAt: true },
        })
        if (!record) return null
        return {
            systemRole: record.systemRole,
            isDeleted: record.deletedAt !== null,
        }
    }

    async findPlan(id: string): Promise<UserPlanView | null> {
        const record = await this.db.user.findUnique({
            where: { id },
            select: { plan: true },
        })
        if (!record) return null
        return { plan: record.plan }
    }

    async findAuthMeView(id: string): Promise<AuthMeView | null> {
        const record = await this.db.user.findUnique({
            where: { id },
            select: {
                id: true,
                plan: true,
                displayName: true,
                email: true,
                avatarUrl: true,
                systemRole: true,
            },
        })
        if (!record) return null
        return {
            id: record.id,
            plan: record.plan,
            displayName: record.displayName,
            email: record.email,
            avatarUrl: record.avatarUrl,
            systemRole: record.systemRole,
        }
    }

    async findLocale(id: string): Promise<{ locale: string | null } | null> {
        const record = await this.db.user.findUnique({
            where: { id },
            select: { locale: true },
        })
        if (!record) return null
        return { locale: record.locale }
    }

    async updateLocale(id: string, locale: string | null): Promise<void> {
        await this.db.user.update({ where: { id }, data: { locale } })
    }

    async findChatSenderProfile(id: string): Promise<{ displayName: string | null; avatarUrl: string | null } | null> {
        const record = await this.db.user.findUnique({
            where: { id },
            select: { displayName: true, avatarUrl: true },
        })
        if (!record) return null
        return { displayName: record.displayName, avatarUrl: record.avatarUrl }
    }

    async findSystemAdminForAssignee(id: string): Promise<{ id: string; systemRole: string; deletedAt: Date | null } | null> {
        return this.db.user.findUnique({
            where: { id },
            select: { id: true, systemRole: true, deletedAt: true },
        })
    }

    async listSystemAdmins(): Promise<Array<{ id: string; displayName: string | null; email: string | null; systemRole: string }>> {
        return this.db.user.findMany({
            where: {
                systemRole: { in: ['OPERATOR', 'SUPER_ADMIN'] },
                deletedAt: null,
            },
            select: { id: true, displayName: true, email: true, systemRole: true },
            orderBy: [{ systemRole: 'asc' }, { displayName: 'asc' }],
        })
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
                plan: data.plan,
                email: data.email,
                phone: data.phone,
                biography: data.biography,
                avatarUrl: data.avatarUrl,
                notificationSetting: data.notificationSetting,
                deletedAt: data.deletedAt,
                updatedAt: new Date(),
            },
            create: {
                id: data.id,
                displayName: data.displayName,
                plan: data.plan,
                email: data.email,
                phone: data.phone,
                biography: data.biography,
                avatarUrl: data.avatarUrl,
                notificationSetting: data.notificationSetting,
                deletedAt: data.deletedAt,
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
            plan: user.getPlan().getValue(),
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
            deletedAt: user.getDeletedAt(),
        }
    }

    // ============================================================
    // Persistence → Domain
    // ============================================================
    private toDomain(record: any): User {

        return User.reconstruct({
            id: record.id,
            displayName: record.displayName,
            plan: record.plan,
            email: record.email,
            phone: record.phone,
            biography: record.biography,
            avatarUrl: record.avatarUrl,

            notification: record.notificationSetting,

            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt ?? null,
        })
    }
}
