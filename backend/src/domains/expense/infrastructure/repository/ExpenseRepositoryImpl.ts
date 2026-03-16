import type { Prisma, PrismaClient, Expense as PrismaExpense } from '@prisma/client'
import { Expense } from '../../domain/model/entity/Expense.js'
import type { IExpenseRepository } from '../../domain/repository/IExpenseRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class ExpenseRepositoryImpl implements IExpenseRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<Expense | null> {
        const row = await this.prisma.expense.findUnique({ where: { id } })
        return row ? this.toDomain(row) : null
    }

    async findsByCommunityId(communityId: string): Promise<Expense[]> {
        const rows = await this.prisma.expense.findMany({
            where: { communityId },
            orderBy: { date: 'desc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async sumByCommunityId(communityId: string): Promise<number> {
        const result = await this.prisma.expense.aggregate({
            where: { communityId },
            _sum: { amount: true },
        })
        return result._sum.amount ?? 0
    }

    async add(expense: Expense): Promise<void> {
        await this.prisma.expense.create({
            data: {
                id: expense.getId(),
                communityId: expense.getCommunityId(),
                categoryId: expense.getCategoryId(),
                amount: expense.getAmount(),
                description: expense.getDescription(),
                date: expense.getDate(),
                createdBy: expense.getCreatedBy(),
            },
        })
    }

    async update(expense: Expense): Promise<void> {
        await this.prisma.expense.update({
            where: { id: expense.getId() },
            data: {
                categoryId: expense.getCategoryId(),
                amount: expense.getAmount(),
                description: expense.getDescription(),
                date: expense.getDate(),
            },
        })
    }

    async delete(id: string): Promise<void> {
        await this.prisma.expense.delete({ where: { id } })
    }

    private toDomain(row: PrismaExpense): Expense {
        return Expense.reconstruct({
            id: row.id,
            communityId: row.communityId,
            categoryId: row.categoryId,
            amount: row.amount,
            description: row.description,
            date: row.date,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        })
    }
}
