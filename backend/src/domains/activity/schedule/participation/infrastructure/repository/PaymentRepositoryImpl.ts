import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { ScheduleId } from '@/domains/activity/schedule/domain/model/valueObject/ScheduleId.js'
import type { Prisma, PrismaClient, Payment as PrismaPayment } from '@prisma/client'
import { Payment } from '../../domain/model/entity/Payment.js'
import { PaymentMethod } from '../../domain/model/valueObject/PaymentMethod.js'
import { PaymentStatus } from '../../domain/model/valueObject/PaymentStatus.js'
import type { IPaymentRepository } from '../../domain/repository/IPaymentRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class PaymentRepositoryImpl implements IPaymentRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<Payment | null> {
        const row = await this.prisma.payment.findUnique({ where: { id } })
        return row ? this.toDomain(row) : null
    }

    async findLatestByScheduleAndUser(scheduleId: string, userId: string): Promise<Payment | null> {
        const row = await this.prisma.payment.findFirst({
            where: { scheduleId, userId },
            orderBy: { createdAt: 'desc' },
        })
        return row ? this.toDomain(row) : null
    }

    async findByStripePaymentIntentId(paymentIntentId: string): Promise<Payment | null> {
        const row = await this.prisma.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
        })
        return row ? this.toDomain(row) : null
    }

    async findsByScheduleId(scheduleId: string): Promise<Payment[]> {
        const rows = await this.prisma.payment.findMany({
            where: { scheduleId },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async existsUnresolvedPayment(
        scheduleId: string,
        userId: string,
        paymentMethod: string,
    ): Promise<boolean> {
        const count = await this.prisma.payment.count({
            where: {
                scheduleId,
                userId,
                paymentMethod,
                status: { in: ['REPORTED', 'CONFIRMED', 'REFUND_PENDING'] },
            },
        })
        return count > 0
    }

    async findRefundPendingByScheduleId(scheduleId: string): Promise<Payment[]> {
        const rows = await this.prisma.payment.findMany({
            where: { scheduleId, status: 'REFUND_PENDING' },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async findRefundPendingByCommunityId(communityId: string): Promise<Payment[]> {
        const rows = await this.prisma.payment.findMany({
            where: {
                status: 'REFUND_PENDING',
                schedule: {
                    activity: { communityId, deletedAt: null },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async findResolvedByCommunityId(communityId: string): Promise<Payment[]> {
        const rows = await this.prisma.payment.findMany({
            where: {
                status: { in: ['REFUNDED', 'NO_REFUND'] },
                schedule: {
                    activity: { communityId, deletedAt: null },
                },
            },
            orderBy: { updatedAt: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async add(payment: Payment): Promise<void> {
        await this.prisma.payment.create({
            data: {
                id: payment.getId(),
                scheduleId: payment.getScheduleId().getValue(),
                userId: payment.getUserId().getValue(),
                paymentMethod: payment.getPaymentMethod().getValue(),
                amount: payment.getAmount(),
                feeAmount: payment.getFeeAmount(),
                status: payment.getPaymentStatus().getValue(),
                stripePaymentIntentId: payment.getStripePaymentIntentId(),
                paymentReportedAt: payment.getPaymentReportedAt(),
                paymentConfirmedAt: payment.getPaymentConfirmedAt(),
                paymentConfirmedBy: payment.getPaymentConfirmedBy(),
            },
        })
    }

    async update(payment: Payment): Promise<void> {
        await this.prisma.payment.update({
            where: { id: payment.getId() },
            data: {
                status: payment.getPaymentStatus().getValue(),
                stripePaymentIntentId: payment.getStripePaymentIntentId(),
                paymentReportedAt: payment.getPaymentReportedAt(),
                paymentConfirmedAt: payment.getPaymentConfirmedAt(),
                paymentConfirmedBy: payment.getPaymentConfirmedBy(),
            },
        })
    }

    private toDomain(row: PrismaPayment): Payment {
        return Payment.reconstruct({
            id: row.id,
            scheduleId: ScheduleId.reconstruct(row.scheduleId),
            userId: UserId.create(row.userId),
            paymentMethod: PaymentMethod.reconstruct(row.paymentMethod),
            amount: row.amount,
            feeAmount: row.feeAmount,
            paymentStatus: PaymentStatus.reconstruct(row.status),
            stripePaymentIntentId: row.stripePaymentIntentId,
            paymentReportedAt: row.paymentReportedAt,
            paymentConfirmedAt: row.paymentConfirmedAt,
            paymentConfirmedBy: row.paymentConfirmedBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        })
    }
}
