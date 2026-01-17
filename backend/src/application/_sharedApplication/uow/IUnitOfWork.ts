// src/application/_sharedApplication/uow/IUnitOfWork.ts

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
 */
export interface IUnitOfWorkWithRepos<TRepositories> {
    /**
     * 正: tx-scope repositories を受け取って処理する
     */
    run<T>(fn: (repos: TRepositories) => Promise<T>): Promise<T>
}