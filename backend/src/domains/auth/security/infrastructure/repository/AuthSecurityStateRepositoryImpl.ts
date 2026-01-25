import { prisma } from '@/_sharedTech/db/client.js'
import type { Prisma, PrismaClient } from '@prisma/client'

import type { IAuthSecurityStateRepository } from '../../domain/repository/IAuthSecurityStateRepository.js'

export class AuthSecurityStateRepositoryImpl implements IAuthSecurityStateRepository {
    constructor(
        private readonly db: PrismaClient | Prisma.TransactionClient = prisma
    ) { }

    async findByUserId(params: { userId: string }): Promise<{
        failedSignInCount: number
        lockedUntil: Date | null
    } | null> {
        const row = await this.db.authSecurityState.findUnique({
            where: { userId: params.userId },
            select: {
                failedSignInCount: true,
                lockedUntil: true,
            },
        })

        return row
    }

    async recordLoginSuccess(params: {
        userId: string
        authMethod: string
        occurredAt: Date
    }): Promise<void> {
        await this.db.authSecurityState.upsert({
            where: { userId: params.userId },
            update: {
                authMethod: params.authMethod,
                lastLoginAt: params.occurredAt,
                failedSignInCount: 0,
                lockedUntil: null,
            },
            create: {
                userId: params.userId,
                authMethod: params.authMethod,
                lastLoginAt: params.occurredAt,
                failedSignInCount: 0,
                lockedUntil: null,
            },
        })
    }

    async recordLoginFailure(params: {
        userId: string
        occurredAt: Date
        maxFailures: number
        lockDurationMs: number
    }): Promise<void> {
        const current = await this.db.authSecurityState.findUnique({
            where: { userId: params.userId },
            select: {
                failedSignInCount: true,
                lockedUntil: true,
            },
        })

        // すでにロック中なら、best-effort 投影更新はスキップ（過剰更新を避ける）
        if (current?.lockedUntil && current.lockedUntil > params.occurredAt) {
            return
        }

        // まずは失敗回数を 1 増やす（存在しなければ作る）
        const updated = await this.db.authSecurityState.upsert({
            where: { userId: params.userId },
            update: {
                failedSignInCount: { increment: 1 },
            },
            create: {
                userId: params.userId,
                authMethod: null,
                lastLoginAt: null,
                failedSignInCount: 1,
                lockedUntil: null,
            },
            select: {
                failedSignInCount: true,
                lockedUntil: true,
            },
        })

        // 閾値到達でロックを付与
        if (updated.failedSignInCount >= params.maxFailures) {
            const lockedUntil = new Date(params.occurredAt.getTime() + params.lockDurationMs)
            await this.db.authSecurityState.update({
                where: { userId: params.userId },
                data: {
                    lockedUntil,
                },
            })
        }
    }
}
