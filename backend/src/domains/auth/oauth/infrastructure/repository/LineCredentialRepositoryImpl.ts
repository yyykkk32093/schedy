import { prisma } from '@/_sharedTech/db/client.js'
import type { Prisma, PrismaClient } from '@prisma/client'
import type { ILineCredentialRepository } from '../../domain/repository/ILineCredentialRepository.js'

export class LineCredentialRepositoryImpl implements ILineCredentialRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma
    ) { }

    async findUserIdByLineUid(params: { lineUid: string }): Promise<string | null> {
        const record = await this.db.lineCredential.findUnique({
            where: { lineUid: params.lineUid },
        })

        return record?.userId ?? null
    }

    async link(params: { userId: string; lineUid: string }): Promise<void> {
        const exists = await this.db.lineCredential.findUnique({
            where: { lineUid: params.lineUid },
        })

        if (exists) {
            if (exists.userId === params.userId) return
            throw new Error('LINE credential already linked to another user')
        }

        await this.db.lineCredential.create({
            data: {
                userId: params.userId,
                lineUid: params.lineUid,
            } satisfies Prisma.LineCredentialUncheckedCreateInput,
        })
    }
}
