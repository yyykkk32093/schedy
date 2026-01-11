// src/application/_sharedApplication/uow/PrismaUnitOfWork.ts

import { prisma } from '@/_sharedTech/db/client.js'
import { IUnitOfWork } from './IUnitOfWork.js'

/**
 * Prisma による UnitOfWork 実装
 *
 * - prisma.$transaction を使って処理をまとめる
 * - UseCase は Prisma の存在を一切知らない
 */
export class PrismaUnitOfWork implements IUnitOfWork {

    async run<T>(fn: () => Promise<T>): Promise<T> {
        return prisma.$transaction(async () => {
            return fn()
        })
    }

}
