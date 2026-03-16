import type { Prisma, PrismaClient, ExpenseCategory as PrismaExpenseCategory } from '@prisma/client'
import { ExpenseCategory } from '../../domain/model/entity/ExpenseCategory.js'
import type { IExpenseCategoryRepository } from '../../domain/repository/IExpenseCategoryRepository.js'

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class ExpenseCategoryRepositoryImpl implements IExpenseCategoryRepository {
    constructor(private readonly prisma: PrismaClientLike) { }

    async findById(id: string): Promise<ExpenseCategory | null> {
        const row = await this.prisma.expenseCategory.findUnique({ where: { id } })
        return row ? this.toDomain(row) : null
    }

    async findsByCommunityId(communityId: string): Promise<ExpenseCategory[]> {
        const rows = await this.prisma.expenseCategory.findMany({
            where: {
                isActive: true,
                OR: [
                    { isSystem: true },
                    { communityId },
                ],
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        })
        return rows.map((r) => this.toDomain(r))
    }

    async findSystemCategories(): Promise<ExpenseCategory[]> {
        const rows = await this.prisma.expenseCategory.findMany({
            where: { isSystem: true, isActive: true },
            orderBy: { sortOrder: 'asc' },
        })
        return rows.map((r) => this.toDomain(r))
    }

    async add(category: ExpenseCategory): Promise<void> {
        await this.prisma.expenseCategory.create({
            data: {
                id: category.getId(),
                communityId: category.getCommunityId(),
                name: category.getName(),
                isSystem: category.getIsSystem(),
                sortOrder: category.getSortOrder(),
                isActive: category.getIsActive(),
            },
        })
    }

    async update(category: ExpenseCategory): Promise<void> {
        await this.prisma.expenseCategory.update({
            where: { id: category.getId() },
            data: {
                name: category.getName(),
                sortOrder: category.getSortOrder(),
                isActive: category.getIsActive(),
            },
        })
    }

    private toDomain(row: PrismaExpenseCategory): ExpenseCategory {
        return ExpenseCategory.reconstruct({
            id: row.id,
            communityId: row.communityId,
            name: row.name,
            isSystem: row.isSystem,
            sortOrder: row.sortOrder,
            isActive: row.isActive,
            createdAt: row.createdAt,
        })
    }
}
