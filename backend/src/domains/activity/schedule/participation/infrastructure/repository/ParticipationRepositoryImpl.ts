import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { Prisma, PrismaClient, Participation as PrismaParticipation } from '@prisma/client'
import { Participation } from '../../domain/model/entity/Participation.js'
import type { IParticipationRepository } from '../../domain/repository/IParticipationRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class ParticipationRepositoryImpl implements IParticipationRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<Participation | null> {
        const row = await this.prisma.participation.findUnique({ where: { id } })
        return row ? this.toDomain(row) : null
    }

    async findByScheduleAndUser(scheduleId: string, userId: string): Promise<Participation | null> {
        const row = await this.prisma.participation.findUnique({
            where: { scheduleId_userId: { scheduleId, userId } },
        })
        return row ? this.toDomain(row) : null
    }

    async findsByScheduleId(scheduleId: string): Promise<Participation[]> {
        const rows = await this.prisma.participation.findMany({
            where: { scheduleId },
            orderBy: { respondedAt: 'asc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async count(scheduleId: string): Promise<number> {
        return this.prisma.participation.count({
            where: { scheduleId },
        })
    }

    async add(participation: Participation): Promise<void> {
        await this.prisma.participation.create({
            data: {
                id: participation.getId(),
                scheduleId: participation.getScheduleId().getValue(),
                userId: participation.getUserId().getValue(),
                isVisitor: participation.getIsVisitor(),
                respondedAt: participation.getRespondedAt(),
            },
        })
    }

    async update(participation: Participation): Promise<void> {
        await this.prisma.participation.update({
            where: { id: participation.getId() },
            data: {
                isVisitor: participation.getIsVisitor(),
            },
        })
    }

    async delete(scheduleId: string, userId: string): Promise<void> {
        await this.prisma.participation.delete({
            where: { scheduleId_userId: { scheduleId, userId } },
        })
    }

    private toDomain(row: PrismaParticipation): Participation {
        return Participation.reconstruct({
            id: row.id,
            scheduleId: ScheduleId.reconstruct(row.scheduleId),
            userId: UserId.create(row.userId),
            isVisitor: row.isVisitor,
            respondedAt: row.respondedAt,
        })
    }
}
