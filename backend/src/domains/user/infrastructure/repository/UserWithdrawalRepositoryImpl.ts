import type { IUserWithdrawalRepository } from '@/domains/user/domain/repository/IUserWithdrawalRepository.js'
import type { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

type PrismaLike = Pick<Prisma.TransactionClient, 'userWithdrawal'>

export class UserWithdrawalRepositoryImpl implements IUserWithdrawalRepository {
    constructor(private readonly db: PrismaLike) { }

    async upsert(input: {
        userId: string
        reason: string
        freeText?: string | null
    }): Promise<void> {
        await this.db.userWithdrawal.upsert({
            where: { userId: input.userId },
            create: {
                id: randomUUID(),
                userId: input.userId,
                reason: input.reason,
                freeText: input.freeText?.trim() || null,
            },
            update: {
                reason: input.reason,
                freeText: input.freeText?.trim() || null,
            },
        })
    }
}
