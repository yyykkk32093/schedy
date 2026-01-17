// src/application/_sharedApplication/uow/PrismaUnitOfWork.ts

import { prisma } from '@/_sharedTech/db/client.js'
import { Prisma } from '@prisma/client'
import { IUnitOfWorkWithRepos } from './IUnitOfWork.js'

/**
 * Prisma による UnitOfWork 実装
 *
 * - prisma.$transaction を使って処理をまとめる
 * - UseCase は Prisma の存在を一切知らない
 */
export type RepositoriesFactory<TRepositories> = (
    tx: Prisma.TransactionClient
) => TRepositories

export class PrismaUnitOfWork<TRepositories = void>
    implements IUnitOfWorkWithRepos<TRepositories> {
    constructor(
        private readonly createRepositories: RepositoriesFactory<TRepositories>
    ) { }

    async run<T>(fn: (repos: TRepositories) => Promise<T>): Promise<T> {
        return prisma.$transaction(async (tx) => {
            const repos = this.createRepositories(tx)
            return fn(repos)
        })
    }
}
