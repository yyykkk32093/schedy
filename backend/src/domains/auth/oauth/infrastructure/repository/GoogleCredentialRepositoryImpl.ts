import { prisma } from '@/_sharedTech/db/client.js'
import type { Prisma, PrismaClient } from '@prisma/client'
import type { IGoogleCredentialRepository } from '../../domain/repository/IGoogleCredentialRepository.js'

export class GoogleCredentialRepositoryImpl implements IGoogleCredentialRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma
    ) { }

    async findUserIdByGoogleUid(params: { googleUid: string }): Promise<string | null> {
        const record = await this.db.googleCredential.findUnique({
            where: { googleUid: params.googleUid },
        })

        return record?.userId ?? null
    }

    async link(params: { userId: string; googleUid: string }): Promise<void> {
        const exists = await this.db.googleCredential.findUnique({
            where: { googleUid: params.googleUid },
        })

        if (exists) {
            if (exists.userId === params.userId) return
            throw new Error('Google credential already linked to another user')
        }

        await this.db.googleCredential.create({
            data: {
                userId: params.userId,
                googleUid: params.googleUid,
            } satisfies Prisma.GoogleCredentialUncheckedCreateInput,
        })
    }
}
