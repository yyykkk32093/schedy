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