// src/application/_sharedApplication/uow/PrismaUnitOfWork.ts

import { prisma } from '@/_sharedTech/db/client.js'
import { TransactionalDomainEventBus } from '@/domains/_sharedDomains/domain/event/TransactionalDomainEventBus.js'
import type { TransactionalDomainEventPublisher } from '@/domains/_sharedDomains/domain/event/TransactionalDomainEventPublisher.js'
import { Prisma } from '@prisma/client'
import { IUnitOfWorkWithRepos } from './IUnitOfWork.js'

/**
 * Prisma による UnitOfWork 実装
 *
 * - prisma.$transaction を使って処理をまとめる
 * - UseCase は Prisma の存在を一切知らない
 *
 * txEventBus（オプション）:
 * - 渡された場合、run() 内で txEventPublisher を生成し
 *   コールバックの第2引数として提供する
 * - Publisher は TX-scope repos をクロージャで捕捉しており、
 *   Subscriber の handle(event, repos) に自動的に渡す
 */
export type RepositoriesFactory<TRepositories> = (
    tx: Prisma.TransactionClient
) => TRepositories

export class PrismaUnitOfWork<TRepositories = void>
    implements IUnitOfWorkWithRepos<TRepositories> {
    constructor(
        private readonly createRepositories: RepositoriesFactory<TRepositories>,
        private readonly txEventBus?: TransactionalDomainEventBus,
    ) { }

    async run<T>(fn: (repos: TRepositories, txEventPublisher?: TransactionalDomainEventPublisher) => Promise<T>): Promise<T> {
        return prisma.$transaction(async (tx) => {
            const repos = this.createRepositories(tx)
            const publisher: TransactionalDomainEventPublisher | undefined = this.txEventBus
                ? {
                    publish: async (event) => await this.txEventBus!.publish(event, repos),
                    publishAll: async (events) => await this.txEventBus!.publishAll(events, repos),
                }
                : undefined
            return fn(repos, publisher)
        })
    }
}
