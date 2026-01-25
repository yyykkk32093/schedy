import { prisma } from '@/_sharedTech/db/client.js'
import { logger } from '@/_sharedTech/logger/logger.js'
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
        try {
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
        } catch (err: unknown) {
            // FK違反(P2003)やレコード不存在(P2025)は best-effort のため握りつぶす
            if (this.isPrismaFKOrNotFoundError(err)) {
                logger.debug(
                    { userId: params.userId, code: (err as { code?: string }).code },
                    '[AuthSecurityState] Ignored FK/NotFound on recordLoginSuccess'
                )
                return
            }
            throw err
        }
    }

    async recordLoginFailure(params: {
        userId: string
        occurredAt: Date
        maxFailures: number
        lockDurationMs: number
    }): Promise<void> {
        try {
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
        } catch (err: unknown) {
            // FK違反(P2003)やレコード不存在(P2025)は best-effort のため握りつぶす
            if (this.isPrismaFKOrNotFoundError(err)) {
                logger.debug(
                    { userId: params.userId, code: (err as { code?: string }).code },
                    '[AuthSecurityState] Ignored FK/NotFound on recordLoginFailure'
                )
                return
            }
            throw err
        }
    }

    private isPrismaFKOrNotFoundError(err: unknown): boolean {
        if (typeof err !== 'object' || err === null) return false
        const code = (err as { code?: string }).code
        return code === 'P2003' || code === 'P2025'
    }
}
