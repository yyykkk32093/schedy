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

    async findByParticipationId(participationId: string): Promise<Payment | null> {
        const row = await this.prisma.payment.findFirst({
            where: { participationId },
            orderBy: { updatedAt: 'desc' },
        })
        return row ? this.toDomain(row) : null
    }

    /** W3-11: コミュニティ配下の CONFIRMED Payment をアクティビティ別に集計 */
    async aggregateConfirmedIncomeByActivity(communityId: string, dateRange?: { from?: Date; to?: Date }): Promise<Array<{
        activityId: string
        total: number
    }>> {
        // D-3:A: 収入は Schedule.date でフィルタ
        const dateConditions: string[] = []
        const params: unknown[] = [communityId]

        if (dateRange?.from) {
            params.push(dateRange.from)
            dateConditions.push(`s."date" >= $${params.length}`)
        }
        if (dateRange?.to) {
            params.push(dateRange.to)
            dateConditions.push(`s."date" <= $${params.length}`)
        }

        const dateClause = dateConditions.length > 0
            ? `AND ${dateConditions.join(' AND ')}`
            : ''

        const rows = await (this.prisma as PrismaClient).$queryRawUnsafe<Array<{ activityId: string; total: bigint }>>(
            `SELECT a."id" AS "activityId", COALESCE(SUM(p."amount"), 0) AS "total"
            FROM "Payment" p
            JOIN "Schedule" s ON p."scheduleId" = s."id"
            JOIN "Activity" a ON s."activityId" = a."id"
            WHERE a."communityId" = $1
              AND p."status" = 'CONFIRMED'
              AND a."deletedAt" IS NULL
              ${dateClause}
            GROUP BY a."id"`,
            ...params,
        )
        return rows.map((r) => ({
            activityId: r.activityId,
            total: Number(r.total),
        }))
    }

    /** 収入タブ詳細: 指定 Activity の CONFIRMED Payment を個別取得（Schedule 別展開用） */
    async getConfirmedPaymentsByActivity(activityId: string, dateRange?: { from?: Date; to?: Date }): Promise<Array<{
        scheduleId: string
        scheduleDate: Date
        scheduleStartTime: string
        displayName: string | null
        amount: number
        userId: string | null
        isVisitor: boolean
    }>> {
        const dateConditions: string[] = []
        const params: unknown[] = [activityId]

        if (dateRange?.from) {
            params.push(dateRange.from)
            dateConditions.push(`s."date" >= $${params.length}`)
        }
        if (dateRange?.to) {
            params.push(dateRange.to)
            dateConditions.push(`s."date" <= $${params.length}`)
        }

        const dateClause = dateConditions.length > 0
            ? `AND ${dateConditions.join(' AND ')}`
            : ''

        const rows = await (this.prisma as PrismaClient).$queryRawUnsafe<Array<{
            scheduleId: string
            scheduleDate: Date
            scheduleStartTime: string
            displayName: string | null
            amount: number
            userId: string | null
            isVisitor: boolean
        }>>(
            `SELECT
                p."scheduleId" AS "scheduleId",
                s."date" AS "scheduleDate",
                s."startTime" AS "scheduleStartTime",
                p."displayName" AS "displayName",
                p."amount" AS "amount",
                p."userId" AS "userId",
                COALESCE(pt."isVisitor", false) AS "isVisitor"
            FROM "Payment" p
            JOIN "Schedule" s ON p."scheduleId" = s."id"
            JOIN "Participation" pt ON p."participationId" = pt."id"
            WHERE s."activityId" = $1
              AND p."status" = 'CONFIRMED'
              ${dateClause}
            ORDER BY s."date" DESC, s."startTime" ASC, p."displayName" ASC`,
            ...params,
        )
        return rows.map((r) => ({
            scheduleId: r.scheduleId,
            scheduleDate: r.scheduleDate,
            scheduleStartTime: r.scheduleStartTime,
            displayName: r.displayName,
            amount: Number(r.amount),
            userId: r.userId,
            isVisitor: r.isVisitor,
        }))
    }

    async add(payment: Payment): Promise<void> {
        await this.prisma.payment.create({
            data: {
                id: payment.getId(),
                scheduleId: payment.getScheduleId().getValue(),
                participationId: payment.getParticipationId(),
                userId: payment.getUserId()?.getValue() ?? null,
                paymentMethod: payment.getPaymentMethod()?.getValue() ?? null,
                displayName: payment.getDisplayName(),
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
                paymentMethod: payment.getPaymentMethod()?.getValue() ?? null,
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
            participationId: row.participationId,
            userId: row.userId ? UserId.create(row.userId) : null,
            paymentMethod: row.paymentMethod ? PaymentMethod.reconstruct(row.paymentMethod) : null,
            displayName: row.displayName ?? null,
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
