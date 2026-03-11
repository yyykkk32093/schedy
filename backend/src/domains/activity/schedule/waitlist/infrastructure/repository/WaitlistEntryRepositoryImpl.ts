import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { Prisma, PrismaClient, WaitlistEntry as PrismaWaitlistEntry } from '@prisma/client'
import { WaitlistEntry } from '../../domain/model/entity/WaitlistEntry.js'
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

    async findNext(scheduleId: string): Promise<WaitlistEntry | null> {
        const row = await this.prisma.waitlistEntry.findFirst({
            where: { scheduleId },
            orderBy: { registeredAt: 'asc' },
        })
        return row ? this.toDomain(row) : null
    }

    async findsByScheduleId(scheduleId: string): Promise<WaitlistEntry[]> {
        const rows = await this.prisma.waitlistEntry.findMany({
            where: { scheduleId },
            orderBy: { registeredAt: 'asc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async count(scheduleId: string): Promise<number> {
        return this.prisma.waitlistEntry.count({
            where: { scheduleId },
        })
    }

    async add(entry: WaitlistEntry): Promise<void> {
        await this.prisma.waitlistEntry.create({
            data: {
                id: entry.getId(),
                scheduleId: entry.getScheduleId().getValue(),
                userId: entry.getUserId().getValue(),
                registeredAt: entry.getRegisteredAt(),
            },
        })
    }

    async delete(scheduleId: string, userId: string): Promise<void> {
        await this.prisma.waitlistEntry.delete({
            where: { scheduleId_userId: { scheduleId, userId } },
        })
    }

    private toDomain(row: PrismaWaitlistEntry): WaitlistEntry {
        return WaitlistEntry.reconstruct({
            id: row.id,
            scheduleId: ScheduleId.reconstruct(row.scheduleId),
            userId: UserId.create(row.userId),
            registeredAt: row.registeredAt,
        })
    }
}
