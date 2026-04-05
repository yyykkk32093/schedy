// src/application/_sharedApplication/uow/IUnitOfWork.ts

import type { TransactionalDomainEventPublisher } from '@/domains/_sharedDomains/domain/event/TransactionalDomainEventPublisher.js'

/**
 * Unit of Work
 *
 * - 1ユースケース内の処理を「ひとまとまり」として実行するための抽象
 * - トランザクションや整合性保証の仕組みを隠蔽する
 */
export interface IUnitOfWork {
    run<T>(fn: () => Promise<T>): Promise<T>
}

/**
 * tx-scope repositories を提供する UnitOfWork。
 *
 * Option C（Repository生成時にtxClient注入）を正とする。
 * - UseCase は txClient を意識しない
 * - UoW が tx-bound Repository 群を組み立てる
 *
 * txEventPublisher（第2引数）:
 * - TX 内でドメインイベントを発行し、Subscriber にアトミックに伝搬する
 * - PrismaUnitOfWork に TransactionalDomainEventBus が渡されている場合のみ有効
 * - 渡されない場合は undefined（後方互換: 既存 UseCase は第2引数を無視可能）
 */
export interface IUnitOfWorkWithRepos<TRepositories> {
    run<T>(fn: (repos: TRepositories, txEventPublisher?: TransactionalDomainEventPublisher) => Promise<T>): Promise<T>
}