// src/application/_sharedApplication/event/DomainEventFlusher.ts

import { BaseDomainEvent } from '@/domains/_sharedDomains/domain/event/BaseDomainEvent.js'
import { DomainEventBus } from '@/domains/_sharedDomains/domain/event/DomainEventBus.js'
import { AggregateRoot } from '@/domains/_sharedDomains/model/entity/AggregateRoot.js'

/**
 * DomainEventFlusher
 *
 * 【役割】
 * - Aggregate に蓄積された DomainEvent をまとめて回収し
 * - DomainEventBus へ publish する責務を持つ
 *
 * 【なぜ UseCase から直接 publish しないか】
 * - 永続化（UnitOfWork）とイベント伝播の責務を分離するため
 * - トランザクション成功後のみイベントを外部へ流すことを保証するため
 *
 * 【このクラスを挟むことで可能になる拡張例】
 * - ある UseCase ではイベントを流し、別の UseCase では流さない制御
 * - バッチ / CLI / Job 実行時は flush しない、または遅延させる
 * - 将来「イベントを1件ずつでなくまとめて流す」戦略に変更
 * - DomainEvent を ApplicationEvent / IntegrationEvent へ変換する前処理の追加
 *
 * 👉 DomainEventFlusher は
 *    「いつ・どの DomainEvent を外に流すか」を決める
 *    アプリケーション層のオーケストレーションポイント
 *
 * 【拡張ポイント例】
 * - Job / Batch 実行時はイベントを流さない
 * - 特定のイベントのみ抑制する
 * - 一括 publish / 遅延 publish への切り替え
 */
export class DomainEventFlusher {

    constructor(
        private readonly domainEventBus: DomainEventBus,

        /**
         * Job / Batch 実行時の制御フラグ
         *
         * true  : DomainEvent を publish しない
         * false : 通常通り publish する
         *
         * ※ 今は未使用（常に false 想定）
         * ※ 将来、JobRunner / CLI から true を渡せる
         * 呼び出し側の実装例：const flusher = new DomainEventFlusher(domainEventBus, true)

         */
        // private readonly suppressEventPublish: boolean = false
    ) { }

    async flushFrom(aggregates: AggregateRoot[]): Promise<void> {

        // ----------------------------------------
        // Job / Batch 実行時はイベント抑制
        // ----------------------------------------
        // if (this.suppressEventPublish) {
        //     // DomainEvent は pull だけして破棄
        //     for (const aggregate of aggregates) {
        //         aggregate.pullDomainEvents()
        //     }
        //     return
        // }

        const events: BaseDomainEvent[] = []

        for (const aggregate of aggregates) {
            events.push(...aggregate.pullDomainEvents())
        }

        if (events.length === 0) return

        await this.domainEventBus.publishAll(events)
    }
}
