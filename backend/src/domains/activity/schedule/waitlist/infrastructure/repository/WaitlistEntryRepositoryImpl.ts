import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { Prisma, PrismaClient, WaitlistEntry as PrismaWaitlistEntry } from '@prisma/client'
import { WaitlistEntry } from '../../domain/model/entity/WaitlistEntry.js'
import { WaitlistStatus } from '../../domain/model/valueObject/WaitlistStatus.js'
import type { IWaitlistEntryRepository } from '../../domain/repository/IWaitlistEntryRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class WaitlistEntryRepositoryImpl implements IWaitlistEntryRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<WaitlistEntry | null> {
        const row = await this.prisma.waitlistEntry.findUnique({ where: { id } })
        return row ? this.toDomain(row) : null
    }

    async findByScheduleAndUser(scheduleId: string, userId: string): Promise<WaitlistEntry | null> {
        const row = await this.prisma.waitlistEntry.findUnique({
            where: { scheduleId_userId: { scheduleId, userId } },
        })
        return row ? this.toDomain(row) : null
    }

    async findNextWaiting(scheduleId: string): Promise<WaitlistEntry | null> {
        const row = await this.prisma.waitlistEntry.findFirst({
            where: { scheduleId, status: 'WAITING' },
            orderBy: { position: 'asc' },
        })
        return row ? this.toDomain(row) : null
    }

    async findsByScheduleId(scheduleId: string): Promise<WaitlistEntry[]> {
        const rows = await this.prisma.waitlistEntry.findMany({
            where: { scheduleId },
            orderBy: { position: 'asc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async countWaiting(scheduleId: string): Promise<number> {
        return this.prisma.waitlistEntry.count({
            where: { scheduleId, status: 'WAITING' },
        })
    }

    async save(entry: WaitlistEntry): Promise<void> {
        await this.prisma.waitlistEntry.upsert({
            where: { id: entry.getId() },
            create: {
                id: entry.getId(),
                scheduleId: entry.getScheduleId().getValue(),
                userId: entry.getUserId().getValue(),
                position: entry.getPosition(),
                status: entry.getStatus().getValue(),
                registeredAt: entry.getRegisteredAt(),
                promotedAt: entry.getPromotedAt(),
                cancelledAt: entry.getCancelledAt(),
            },
            update: {
                status: entry.getStatus().getValue(),
                promotedAt: entry.getPromotedAt(),
                cancelledAt: entry.getCancelledAt(),
            },
        })
    }

    private toDomain(row: PrismaWaitlistEntry): WaitlistEntry {
        return WaitlistEntry.reconstruct({
            id: row.id,
            scheduleId: ScheduleId.reconstruct(row.scheduleId),
            userId: UserId.create(row.userId),
            position: row.position,
            status: WaitlistStatus.reconstruct(row.status),
            registeredAt: row.registeredAt,
            promotedAt: row.promotedAt,
            cancelledAt: row.cancelledAt,
        })
    }
}
