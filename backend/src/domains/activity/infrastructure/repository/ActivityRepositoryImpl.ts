import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { Prisma, Activity as PrismaActivity, PrismaClient } from '@prisma/client'
import { Activity } from '../../domain/model/entity/Activity.js'
import { ActivityDescription } from '../../domain/model/valueObject/ActivityDescription.js'
import { ActivityId } from '../../domain/model/valueObject/ActivityId.js'
import { ActivityTitle } from '../../domain/model/valueObject/ActivityTitle.js'
import { DefaultLocation } from '../../domain/model/valueObject/DefaultLocation.js'
import { TimeOfDay } from '../../domain/model/valueObject/TimeOfDay.js'
import type { IActivityRepository } from '../../domain/repository/IActivityRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class ActivityRepositoryImpl implements IActivityRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<Activity | null> {
        const row = await this.prisma.activity.findFirst({
            where: { id, deletedAt: null },
        })
        return row ? this.toDomain(row) : null
    }

    async findsByCommunityId(communityId: string): Promise<Activity[]> {
        const rows = await this.prisma.activity.findMany({
            where: { communityId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async findByRecurrenceRuleNotNull(): Promise<Activity[]> {
        const rows = await this.prisma.activity.findMany({
            where: { recurrenceRule: { not: null }, deletedAt: null },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async save(activity: Activity): Promise<void> {
        await this.prisma.activity.upsert({
            where: { id: activity.getId().getValue() },
            create: {
                id: activity.getId().getValue(),
                communityId: activity.getCommunityId().getValue(),
                title: activity.getTitle().getValue(),
                description: activity.getDescription()?.getValue() ?? null,
                defaultLocation: activity.getDefaultLocation()?.getValue() ?? null,
                defaultStartTime: activity.getDefaultStartTime()?.getValue() ?? null,
                defaultEndTime: activity.getDefaultEndTime()?.getValue() ?? null,
                recurrenceRule: activity.getRecurrenceRule(),
                createdBy: activity.getCreatedBy().getValue(),
                deletedAt: activity.getDeletedAt(),
            },
            update: {
                title: activity.getTitle().getValue(),
                description: activity.getDescription()?.getValue() ?? null,
                defaultLocation: activity.getDefaultLocation()?.getValue() ?? null,
                defaultStartTime: activity.getDefaultStartTime()?.getValue() ?? null,
                defaultEndTime: activity.getDefaultEndTime()?.getValue() ?? null,
                recurrenceRule: activity.getRecurrenceRule(),
                deletedAt: activity.getDeletedAt(),
            },
        })
    }

    private toDomain(row: PrismaActivity): Activity {
        return Activity.reconstruct({
            id: ActivityId.reconstruct(row.id),
            communityId: CommunityId.reconstruct(row.communityId),
            title: ActivityTitle.reconstruct(row.title),
            description: row.description ? ActivityDescription.reconstruct(row.description) : null,
            defaultLocation: row.defaultLocation ? DefaultLocation.reconstruct(row.defaultLocation) : null,
            defaultStartTime: row.defaultStartTime ? TimeOfDay.reconstruct(row.defaultStartTime) : null,
            defaultEndTime: row.defaultEndTime ? TimeOfDay.reconstruct(row.defaultEndTime) : null,
            recurrenceRule: row.recurrenceRule,
            createdBy: UserId.create(row.createdBy),
            deletedAt: row.deletedAt,
        })
    }
}
