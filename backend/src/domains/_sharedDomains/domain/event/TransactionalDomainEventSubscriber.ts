// src/domains/_sharedDomains/domain/event/TransactionalDomainEventSubscriber.ts

import { BaseDomainEvent } from './BaseDomainEvent.js'

/**
 * トランザクション内ドメインイベントSubscriber。
 *
 * 通常の DomainEventSubscriber（TX commit 後に実行）とは異なり、
 * handle() に TX-scope リポジトリが渡されるため、
 * 同一トランザクション内でアトミックにDB操作が可能。
 *
 * - 退出処理の連鎖（Participation キャンセル、WaitlistEntry 削除等）
 * - 繰り上げ時の Payment 自動作成
 * など、TX 整合性が必須な副作用に使う。
 *
 * repos の型は UseCase の TxRepositories に依存するため、
 * Subscriber 側では必要なリポジトリのみ構造的に参照する。
 * 型安全性は UseCase の TxRepositories 定義で担保する（D-P2-16 Choice I）。
 */
export interface TransactionalDomainEventSubscriber<
    TEvent extends BaseDomainEvent = BaseDomainEvent
> {
    subscribedTo(): string | string[]
    handle(event: TEvent, repos: any): Promise<void>
}
