import { prisma } from '@/_sharedTech/db/client.js'
import type { Prisma, PrismaClient } from '@prisma/client'
import type { IAppleCredentialRepository } from '../../domain/repository/IAppleCredentialRepository.js'

export class AppleCredentialRepositoryImpl implements IAppleCredentialRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma
    ) { }

    async findUserIdByAppleUid(params: { appleUid: string }): Promise<string | null> {
        const record = await this.db.appleCredential.findUnique({
            where: { appleUid: params.appleUid },
        })

        return record?.userId ?? null
    }

    async link(params: { userId: string; appleUid: string }): Promise<void> {
        const exists = await this.db.appleCredential.findUnique({
            where: { appleUid: params.appleUid },
        })

        if (exists) {
            if (exists.userId === params.userId) return
            throw new Error('Apple credential already linked to another user')
        }

        await this.db.appleCredential.create({
            data: {
                userId: params.userId,
                appleUid: params.appleUid,
            } satisfies Prisma.AppleCredentialUncheckedCreateInput,
        })
    }
}
