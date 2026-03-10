import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { Prisma, PrismaClient, Participation as PrismaParticipation } from '@prisma/client'
import { Participation } from '../../domain/model/entity/Participation.js'
import { ParticipationStatus } from '../../domain/model/valueObject/ParticipationStatus.js'
import { PaymentMethod } from '../../domain/model/valueObject/PaymentMethod.js'
import { PaymentStatus } from '../../domain/model/valueObject/PaymentStatus.js'
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

    async countAttending(scheduleId: string): Promise<number> {
        return this.prisma.participation.count({
            where: { scheduleId, status: 'ATTENDING' },
        })
    }

    async save(participation: Participation): Promise<void> {
        await this.prisma.participation.upsert({
            where: { id: participation.getId() },
            create: {
                id: participation.getId(),
                scheduleId: participation.getScheduleId().getValue(),
                userId: participation.getUserId().getValue(),
                status: participation.getStatus().getValue(),
                isVisitor: participation.getIsVisitor(),
                respondedAt: participation.getRespondedAt(),
                cancelledAt: participation.getCancelledAt(),
                paymentMethod: participation.getPaymentMethod()?.getValue() ?? null,
                paymentStatus: participation.getPaymentStatus()?.getValue() ?? null,
                paymentReportedAt: participation.getPaymentReportedAt(),
                paymentConfirmedAt: participation.getPaymentConfirmedAt(),
                paymentConfirmedBy: participation.getPaymentConfirmedBy(),
            },
            update: {
                status: participation.getStatus().getValue(),
                cancelledAt: participation.getCancelledAt(),
                paymentMethod: participation.getPaymentMethod()?.getValue() ?? null,
                paymentStatus: participation.getPaymentStatus()?.getValue() ?? null,
                paymentReportedAt: participation.getPaymentReportedAt(),
                paymentConfirmedAt: participation.getPaymentConfirmedAt(),
                paymentConfirmedBy: participation.getPaymentConfirmedBy(),
            },
        })
    }

    private toDomain(row: PrismaParticipation): Participation {
        return Participation.reconstruct({
            id: row.id,
            scheduleId: ScheduleId.reconstruct(row.scheduleId),
            userId: UserId.create(row.userId),
            status: ParticipationStatus.reconstruct(row.status),
            isVisitor: row.isVisitor,
            respondedAt: row.respondedAt,
            cancelledAt: row.cancelledAt,
            paymentMethod: row.paymentMethod ? PaymentMethod.reconstruct(row.paymentMethod) : null,
            paymentStatus: row.paymentStatus ? PaymentStatus.reconstruct(row.paymentStatus) : null,
            paymentReportedAt: row.paymentReportedAt,
            paymentConfirmedAt: row.paymentConfirmedAt,
            paymentConfirmedBy: row.paymentConfirmedBy,
        })
    }
}
