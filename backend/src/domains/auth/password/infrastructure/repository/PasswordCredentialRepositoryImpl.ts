import { prisma } from '@/_sharedTech/db/client.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import type { Prisma, PrismaClient } from '@prisma/client'
import { PasswordCredential } from '../../domain/model/entity/PasswordCredential.js'
import { IPasswordCredentialRepository } from '../../domain/repository/IPasswordCredentialRepository.js'

export class PasswordCredentialRepositoryImpl implements IPasswordCredentialRepository {

    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma
    ) { }

    async findByUserId(userId: UserId): Promise<PasswordCredential | null> {
        const record = await this.db.passwordCredential.findUnique({
            where: { userId: userId.getValue() },
        })

        if (!record) return null

        return PasswordCredential.reconstruct({
            userId: record.userId,
            hashedPassword: record.hashedPassword,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        })
    }

    async save(cred: PasswordCredential): Promise<void> {

        await this.db.passwordCredential.upsert({
            where: { userId: cred.getUserId() },
            update: {
                hashedPassword: cred.getHashedPassword().getValue(),
                updatedAt: new Date(),
            },
            create: {
                userId: cred.getUserId(),
                hashedPassword: cred.getHashedPassword().getValue(),
                createdAt: cred.getCreatedAt(),
                updatedAt: cred.getUpdatedAt(),
            }
        })
    }
}
