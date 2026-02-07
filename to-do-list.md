# 📌 Outbox → Integration → AuditLog 課題管理（最新版）

## A. Outbox / Integration / AuditLog 基盤

- [ ] **1. Outbox → Integration → AuditLog の実動作確認（本番相当条件）**
  - E2E は通ったが、実運用想定の「大量トラフィック / 遅延 / 失敗」の検証が未完。

- [x] **2. OutboxEvent → IntegrationEvent のマッピング整理**
  - eventName / eventType / routingKey の役割整理は完了。

- [ ] **3. Dispatcher / Handler の配置整理**
  - 現状 sharedDomains にあるが、DDD 的には application 層へ移動検討が必要。


## B. Worker / Retry / ログ強化

- [x] **4. Worker ログ出力の追加**
  - 基本ログ（成功 / 失敗 / retry / publish）出力は実装済み。

- [ ] **5. エラーハンドリング強化（※全体的に未完）**
  ### ■ 未実装 / 途中の項目
  - [ ] **5-1. エラー分類（Error Taxonomy）の導入**
    - timeout / network error / handler error / 4xx / 5xx を分類し、  
      「retry すべきもの / retry 不可（即 FAILED）」を切り分ける必要がある。

  - [ ] **5-2. Dispatcher のエラー種類の詳細化**
    - handler not found
    - handler 内部例外
    - HttpClient エラー  
      ※ 現状は “catch(err)” 一括扱い。

  - [ ] **5-3. Dead Letter Queue（DLQ）連動の拡張**
    - DLQ テーブルは存在するが、以下が未完：
      - 最終 HTTP エラー内容保存
      - errorStack の保存
      - FAILED 理由（errorType）を分類保存
      - retryCount / maxRetries の記録

  - [ ] **5-4. Integration API 側（AuditLog）のエラーハンドリング強化**
    - handler（RecordAuditLogUseCase）内部の try/catch が未実装
    - エラー発生時に DLQ 側へ転送する仕組みが未実装

  - [ ] **5-5. retry/backoff アルゴリズムの拡張**
    - equal-jitter のみ → full-jitter / fixed 等選択可能に

  - [ ] **5-6. Worker レベルの通知（Slack/Sentry/etc.）**
    - マルチ失敗 / DLQ 落下時の通知実装が必要


- [x] **6. RetryPolicy の拡張設計（完了扱い）**
  - eventType ごとの maxRetries / interval 設計は完了。


## C. Prisma / DB / Migration

- [x] **7. schema.prisma の破損 → 再構築**
  - migration reset → migrate dev により復旧。


## D. Integration API 設計

- [x] **8. Integration API の単一入口整理**
  - `/integration/v1/audit/logs` に集約。

- [ ] **9. Payload の標準化**
  - Auth 以外の将来イベントを見据えた標準 DTO の再定義は未完。


## E. フォルダ構造 / 実行方法 / 通信層

- [x] **10. Worker のビルド・実行方法確立**
  - dist 生成 → startOutboxWorker.js 起動まで確認済み。

- [x] **11. IntegrationHandler の共通通信層（完了扱い）**
  - HttpClient / FakeHttpClient の統一導入済み。



---

# 🟩 完了（Done）

- eventType / routingKey / eventName の整理  
- Prisma schema の修復  
- Migration と schema の同期  
- Worker 実行  
- Integration API 統一  
- RetryPolicy の設計  
- 共通 HttpClient 導入  
- Worker ログ出力の追加  


---

# 🟥 未完（ToDo）

### Outbox / Integration / AuditLog

- Outbox → Integration → AuditLog の実運用レベル動作確認  
- Dispatcher / Handler のレイヤ配置整理  
- Payload 標準化（Auth 以外も対応可能に）  

### エラーハンドリング強化（重点領域）
- エラー分類（Error Taxonomy）
- Dispatcher エラー詳細化
- DLQ 拡張（errorStack / lastResponse / errorType）
- Integration API 側のエラーハンドリング強化
- retry/backoff アルゴリズムの拡張
- Worker の通知（Slack/Sentry）
- Worker SIGINT / graceful shutdown 動作確認  
- ログ標準化（logger の正式適用）

---

# 🔸 補足タスク

- Integration API の冪等性  
- audit.log handler の最終整備  
- Outbox 監視画面  
- OutboxPublisher の見直し  