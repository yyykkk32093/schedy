# Phase 5+ — 大規模新機能（設計判断確定済み）

> **最終更新**: 2026-07-14
> **ステータス**: ✅ Phase 5+ 完了

## フェーズ概要
- **ゴール**: Phase 0〜4 完了を前提に、基盤整備 → 機能実装の順で着手
- **対象**: D-0, W4-10, W4-11, W4-01, W4-02, W4-03, W4-05, W4-07, W4-08
- **除外**: W4-04（広告）/ W4-06（便利機能）→ wave5 に移管
- **変更対象レイヤー**: 全レイヤー
- **規模**: S〜XL（9件 + D-0 前提作業）

---

## 実行順序

| 順序 | タスク                                     | 規模 | 理由                                      |
| ---- | ------------------------------------------ | ---- | ----------------------------------------- |
| 0    | D-0 旧カラム削除                           | S    | 全体の前提条件（クリーンな状態で開始）    |
| 1    | W4-10 API バリデーション基盤整備           | L    | 以降の全実装で Zod ミドルウェアを活用     |
| 2    | W4-11 ValueObject カバレッジ拡充           | M    | W4-01 の VO と同時に実施                  |
| 3    | W4-01 コミュニティ作成ウィザード化         | XL   | W4-03 の前提                              |
| 4    | W4-02 プラン変更動線（Stripe Billing連携） | XL   | W4-07 の前提。独立して着手可能            |
| 5    | W4-03 コミュニティ詳細検索化               | L    | W4-01 完了後                              |
| 6    | W4-05 サブコミュニティ                     | XL   | 独立して着手可能                          |
| 7    | W4-08 パスリファクタ                       | M    | 全ナビゲーション + 通知 metadata 一斉変更 |
| 8    | W4-07 決済連携（PayPay/クレジット）        | L    | W4-02 完了後                              |

---

## 設計判断サマリー（全確定）

| ID       | 判断ポイント                 | 決定                                                                                                               |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| D-0      | 旧カラム削除                 | W4-01 着手前に独立マイグレーションで `mainActivityArea` / `nearestStation` を削除                                  |
| W4-01-D1 | `targetGender` 型設計        | `String[]` + ドメイン VO `GenderTarget`（既存方針「DB は String / 型安全は TS」と一貫）                            |
| W4-01-D2 | `AgeRange` / `LevelRange` VO | 初めから VO 化。`AgeRange(min:0-99, max:min-99)` / `LevelRange(min:0-8, max:min-8)`                                |
| W4-01-D3 | ウィザード状態管理           | React Hook Form + useContext でステップ間状態共有。最終ステップで一括送信                                          |
| W4-02-D1 | サブスクリプション DB モデル | User に `stripeCustomerId` + 独立 `Subscription` テーブル。`User.plan` は derived state                            |
| W4-02-D2 | プラン変更ドメインモデル     | `SubscriptionAggregate` 新設 + `PlanChangePolicy` VO でダウングレード影響判定                                      |
| W4-02-D3 | Stripe Webhook 処理          | 専用エンドポイント + `StripeEvent` テーブル（冪等性）+ Outbox パターン                                             |
| W4-05-D1 | 階層の深さ制限               | 1階層のみ（`MAX_DEPTH` を 3→1 に変更）                                                                             |
| W4-05-D2 | 権限伝播                     | 実体 Membership 自動作成 + OWNER 委譲時の子伝播 + ADMIN 同期はユーザー選択式（`propagateToChildren`）              |
| W4-08-D1 | 旧パス互換                   | 一斉切り替え（リダイレクトなし）。稼働前システムのため旧パスは廃止                                                 |
| W4-10-D1 | Zod ミドルウェア適用戦略     | 全 POST/PUT/PATCH エンドポイント一括適用                                                                           |
| W4-11-D1 | VO 対象選定基準              | ビジネスルールを持つフィールドのみ（`AgeRange`, `LevelRange`, `GenderTarget`, `Fee`, `ImageUrl`, `MeetingUrl` 等） |
| FC-2     | `CommunityLocation.type`     | 現状の TS union 型 (`'MAIN'                                                                                        | 'SUB'`) を維持。Prisma enum 化しない |

---

## タスク一覧

| タスク                                                   | 状態   | 規模 | 依存  | 設計判断       |
| -------------------------------------------------------- | ------ | ---- | ----- | -------------- |
| D-0 旧カラム削除（mainActivityArea / nearestStation）    | ✅ 完了 | S    | なし  | D-0            |
| W4-10 API バリデーション基盤整備（全エンドポイント Zod） | ✅ 完了 | L    | D-0   | W4-10-D1       |
| W4-11 ValueObject カバレッジ拡充（Fee, ImageUrl 等）     | ✅ 完了 | M    | なし  | W4-11-D1       |
| W4-01 コミュニティ作成: ウィザード化（3ページ+詳細設定） | ✅ 完了 | XL   | D-0   | W4-01-D1/D2/D3 |
| W4-02 マイページ: プラン変更動線（Stripe Billing連携）   | ✅ 完了 | XL   | なし  | W4-02-D1/D2/D3 |
| W4-03 コミュニティ検索: 詳細検索化                       | ✅ 完了 | L    | W4-01 | —              |
| W4-05 サブコミュニティ                                   | ✅ 完了 | XL   | なし  | W4-05-D1/D2    |
| W4-08 アクティビティ詳細パス: ネスト型リファクタ         | ✅ 完了 | M    | なし  | W4-08-D1       |
| W4-07 キャンセル待ち繰り上げ: PayPay/クレジット決済連携  | ✅ 完了 | L    | W4-02 | —              |

---

## D-0 旧カラム削除（mainActivityArea / nearestStation）

- **分類**: クリーンアップ
- **優先度**: P0（Phase 5+ 前提条件）
- **変更対象**: バックエンド
- **変更レイヤー**: DB / Domain / UseCase / API
- **依存**: なし

### 変更内容
1. **Prisma スキーマ**: Community モデルから `mainActivityArea` / `nearestStation` カラムを削除
2. **マイグレーション**: `ALTER TABLE DROP COLUMN` のみ（データは Phase 3 C-12 で `CommunityLocation` に移行済み）
3. **Community エンティティ**: `mainActivityArea` / `nearestStation` フィールド・getter を除去
4. **DTO / API レスポンス**: 旧カラム参照箇所を削除
5. **フロントエンド**: 旧カラム参照箇所があれば削除（`CommunityLocation` 系に移行済みのはず）

### 受入条件
- `mainActivityArea` / `nearestStation` がスキーマ・コード上から完全に除去されていること
- `CommunityLocation` テーブル経由でのみ活動場所/駅が取得できること
- ビルドが通ること

---

## W4-10 API バリデーション基盤整備

- **分類**: 基盤整備
- **優先度**: P1
- **変更対象**: バックエンド
- **変更レイヤー**: API
- **由来**: Phase 3 派生
- **依存**: なし
- **参照**: `docs/validation/validation-strategy.md`

### 設計判断: W4-10-D1
- **決定**: 全 POST/PUT/PATCH エンドポイントに `validateBody()` Zod ミドルウェアを一括適用
- **方式**: 2層バリデーション（API層 Zod + ドメイン層 VO）

### 変更内容
1. 共通 `validateBody()` ミドルウェアの実装（Phase 3 で metadata 限定で導入済みを汎用化）
2. 全 POST/PUT/PATCH エンドポイントの Zod スキーマ定義
3. エラーレスポンスの統一フォーマット

### 受入条件
- 全 POST/PUT/PATCH エンドポイントにバリデーションミドルウェアが適用されていること
- 不正リクエストに対して統一的なエラーレスポンスが返ること
- 既存の正常系リクエストに回帰がないこと

---

## W4-11 ValueObject カバレッジ拡充

- **分類**: 基盤整備
- **優先度**: P1
- **変更対象**: バックエンド
- **変更レイヤー**: Domain
- **由来**: Phase 3 派生
- **依存**: なし

### 設計判断: W4-11-D1
- **決定**: ビジネスルールを持つフィールドのみ VO 化
- **対象**: `GenderTarget`, `AgeRange`, `LevelRange`, `Fee`, `ImageUrl`, `MeetingUrl` 等
- **対象外**: 単なる String（`description` 等）

### 変更内容
1. 新規 VO の実装（W4-01 で追加されるものと同時進行）
2. 既存エンティティへの VO 適用
3. UseCase / API 層の型変更

### 受入条件
- 対象フィールドが VO 経由でのみドメイン層に入ること
- VO のバリデーションロジックが単体テストでカバーされていること

---

## W4-01 コミュニティ作成: ウィザード化

- **分類**: 機能拡張
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **由来**: wave2繰越 #54
- **依存**: D-0（旧カラム削除完了後）
- **事前準備**: ✅ 設計判断確定済み

### 設計判断
| ID       | 判断                  | 決定                                                                                    |
| -------- | --------------------- | --------------------------------------------------------------------------------------- |
| W4-01-D1 | `targetGender` 型設計 | `String[]` + ドメイン VO `GenderTarget`。許容値: `MALE, FEMALE, NON_BINARY, ALL, OTHER` |
| W4-01-D2 | 範囲型 VO             | 初めから VO 化。`AgeRange(min:0-99, max:min-99)` / `LevelRange(min:0-8, max:min-8)`     |
| W4-01-D3 | ウィザード状態管理    | React Hook Form + useContext。Zod スキーマでステップ別+全体バリデーション               |

### ウィザードページ構成

| ページ            | 内容                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1. 基本情報       | 名前・説明・カバー画像                                                                                               |
| 2. 参加設定       | 公開/非公開、参加方式（自由参加/承認制/招待制）                                                                      |
| 3. カテゴリ・タグ | カテゴリ選択、タグ入力 → 完了 or 詳細設定へ                                                                          |
| 詳細設定（任意）  | 最大メンバー数、年齢層（範囲）、対象性別（複数選択）、活動エリア・最寄駅、活動頻度、活動曜日、推奨レベル（0〜8範囲） |

### DB変更（Community テーブル）
- `targetGender String[]` — 対象性別（複数選択可、VO `GenderTarget` でバリデーション）
- `targetAgeMin Int?` / `targetAgeMax Int?` — 対象年齢範囲（VO `AgeRange` で min ≤ max 保証）
- `recommendedLevelMin Int?` / `recommendedLevelMax Int?` — 推奨レベル範囲（VO `LevelRange` で 0-8 範囲 + min ≤ max 保証）
- `activityDayOfWeek` は既存 `CommunityActivityDay` テーブル活用
- ※ `isSearchable` は不要。非公開コミュニティ = 検索対象外のルールで統一

### 備考
- C-12（Phase 3 の複数場所入力）で `CommunityLocation` テーブルが実装済みのため、ウィザードの詳細設定ではその成果を活用する
- C-13（Phase 2 のレイアウト改修）で追加項目の表示枠が整備される前提

### 受入条件
- 3ページのウィザード形式でコミュニティが作成できること
- 詳細設定（任意）で追加属性を設定できること
- `targetGender` が複数選択可能であること
- 年齢範囲・レベル範囲の min ≤ max バリデーションが機能すること
- 既存のコミュニティ作成機能に回帰がないこと

---

## W4-02 マイページ: プラン変更動線（Stripe Billing連携）

- **分類**: 新機能
- **優先度**: P1
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **由来**: wave2繰越 #56
- **依存**: なし
- **事前準備**: ✅ 設計判断確定済み

### 設計判断
| ID       | 判断           | 決定                                                                              |
| -------- | -------------- | --------------------------------------------------------------------------------- |
| W4-02-D1 | DB モデル      | User に `stripeCustomerId` + 独立 `Subscription` テーブル。`User.plan` は derived |
| W4-02-D2 | ドメインモデル | `SubscriptionAggregate` 新設 + `PlanChangePolicy` VO                              |
| W4-02-D3 | Webhook 処理   | `StripeEvent` テーブル（冪等性）+ Outbox パターン                                 |

### DB変更
```
User テーブル:
  + stripeCustomerId String? @unique

Subscription テーブル（新設）:
  id                    String   @id @default(uuid())
  userId                String   @unique
  stripeSubscriptionId  String   @unique
  plan                  String   // 'SUBSCRIBER' | 'LIFETIME'
  status                String   // 'active' | 'past_due' | 'canceled' | 'incomplete'
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

StripeEvent テーブル（新設）:
  id              String    @id @default(uuid())
  stripeEventId   String    @unique
  type            String
  data            Json
  processedAt     DateTime?
  createdAt       DateTime  @default(now())
```

### 仕様

| 項目               | 内容                                                           |
| ------------------ | -------------------------------------------------------------- |
| プラン変更画面     | 現在のプラン表示 + 変更先プランの選択 + 確認ダイアログ         |
| 変更反映タイミング | 次回更新日（毎月1日）に適用。即時変更ではない                  |
| ダウングレード時   | `PlanChangePolicy.evaluate()` で影響判定 → アラート表示        |
| Stripe連携         | Stripe Billing のサブスクリプション変更/キャンセルAPI          |
| Webhook処理        | `StripeEvent` テーブルで冪等性担保 → Outbox ジョブで非同期処理 |

### 受入条件
- マイページからプラン変更画面にアクセスできること
- プラン変更が Stripe Billing と連携して動作すること
- ダウングレード時にアラートが表示されること
- Webhook で Stripe イベントが冪等に処理されること

---

## W4-03 コミュニティ検索: 詳細検索化

- **分類**: 機能拡張
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **由来**: wave2繰越
- **依存**: W4-01（ウィザード化による詳細設定項目の追加）

### 仕様
- W4-01 の詳細設定項目と連動
- カテゴリ・エリア・レベル・曜日・性別でフィルタ
- `CommunityLocation` テーブルでエリア検索（Phase 3 C-12 で新設済み）
- `targetGender` は PostgreSQL 配列演算子 `@>` で検索
- `recommendedLevelMin/Max` は範囲重複クエリで検索

### 受入条件
- カテゴリ・エリア・レベル・曜日・性別で絞り込み検索ができること
- 検索結果が正確であること

---

## W4-05 サブコミュニティ

- **分類**: 新機能
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **由来**: 積み残し #4
- **依存**: なし
- **事前準備**: ✅ 設計判断確定済み

### 設計判断
| ID       | 判断           | 決定                                                                                                  |
| -------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| W4-05-D1 | 階層の深さ制限 | 1階層のみ（`MAX_DEPTH` を 3→1 に変更）                                                                |
| W4-05-D2 | 権限伝播       | 実体 Membership 自動作成 + OWNER 委譲→子に自動伝播 + ADMIN 同期はユーザー選択式 `propagateToChildren` |

### 変更内容

#### DB変更
- `Community.MAX_DEPTH` を 3→1 に変更（エンティティ側の制約）
- 既存の `parentId` / `depth` / 自己参照リレーションをそのまま活用

#### 権限伝播ロジック
1. **子コミュニティ作成時**: 親の全 OWNER/ADMIN の Membership レコードを子にも INSERT
2. **OWNER 委譲時**（`ChangeMemberRoleUseCase` 拡張）:
   - 新 OWNER → 子コミュニティの OWNER に自動昇格
   - 旧 OWNER → 子コミュニティの ADMIN に自動降格
   - トランザクション内で処理
3. **ADMIN 追加/削除時**（`ChangeMemberRoleUseCase` 拡張）:
   - API パラメータ `propagateToChildren: boolean` を追加
   - UI で「子コミュニティにも反映しますか？」の選択肢を提示
   - `true` の場合のみ子コミュニティの Membership を同期

### 仕様
- サブコミュニティは検索結果に表示されない（`depth > 0` を除外条件に追加）
- UI: コミュニティ詳細画面にカルーセル表示 + リスト表示切替可能

### 受入条件
- コミュニティ内にサブコミュニティを作成できること（1階層のみ）
- 親の OWNER/ADMIN がサブコミュニティの管理権限を自動で持つこと
- OWNER 委譲がサブコミュニティにも自動伝播すること
- ADMIN 追加/削除時に子への反映を選択できること
- サブコミュニティが検索結果に含まれないこと

---

## W4-08 アクティビティ詳細パス: ネスト型リファクタ

- **分類**: リファクタ
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **由来**: 積み残し #10
- **依存**: なし（稼働前システムのため互換性不要）

### 設計判断: W4-08-D1
- **決定**: 一斉切り替え（リダイレクトなし）。旧パスは即時廃止。

### 仕様
```
変更前: /activities/:activityId?schedule=xxx
変更後: /communities/:communityId/activities/:activityId?schedule=xxx
```

#### 変更箇所
- フロントルーティング定義
- ナビゲーション箇所（FeedCard, ActivityCard, SearchResult, NotificationPage等）
- 通知 metadata 内の URL 生成（BE）— 既に `communityId` が metadata に含まれている
- LIFF / ネイティブアプリのディープリンクハンドラ

### 受入条件
- 新パス形式でアクティビティ詳細にアクセスできること
- 全ナビゲーション箇所が新パスを使用していること

---

## W4-07 キャンセル待ち繰り上げ: PayPay/クレジット決済連携

- **分類**: 機能拡張
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain
- **由来**: 積み残し #8後半
- **依存**: W4-02（Stripe基盤整備）

### 仕様
- Stripe Connect Express フロー
- PayPay決済リンク生成
- W4-02 の Stripe 基盤整備と連動
- wave3 W3-10（現金デフォルト自動作成）の拡張

### 受入条件
- 繰り上げ時にPayPay/クレジット決済を選択できること
- 決済が正常に処理されること

---

## 作業ログ
- 2026-03-20: Phase 5+ 作成。8件の大規模新機能を一覧化。各項目は独立した設計フェーズを経てから実装に移る方針。依存関係と事前準備事項を明記。
- 2026-03-22: 設計判断すり合わせ完了（全12件確定）。W4-04（広告）/ W4-06（便利機能）を wave5 に移管。実行順序を確定: D-0→W4-10→W4-11→W4-01→W4-02→W4-03→W4-05→W4-08→W4-07。D-0（旧カラム削除）に着手。
- 2026-03-22: D-0 完了。BE 8ファイル（schema, entity, repository I/F+Impl, UseCase×2, controller, bookmarkRoutes）+ FE 7ファイル（types/api.ts, CommunityCreatePage, SearchDetailPage, SearchPage, MetaSection, SettingsPage, communityApi）+ seed SQL 修正。マイグレーション `20260321194248_remove_main_activity_area_nearest_station` 適用。BE/FE 両方 tsc --noEmit エラーなし。
- 2026-07-14: W4-10 完了。全 POST/PUT/PATCH エンドポイントに Zod validateBody ミドルウェアを一括適用。
- 2026-07-14: W4-11 完了。GenderTarget, AgeRange, LevelRange, Fee, ImageUrl, MeetingUrl 等の ValueObject を実装・適用。
- 2026-07-14: W4-01 完了。ウィザード形式コミュニティ作成（3ページ+詳細設定）。targetGender String[] + AgeRange/LevelRange VO。マイグレーション `20260322051742_add_target_gender` 適用。React Context でステップ間状態共有。
- 2026-07-14: W4-02 完了。Stripe Billing 連携（Subscription テーブル新設、StripeEvent テーブル新設、Webhook エンドポイント、PlanChangePolicy VO）。マイグレーション `20260322052000_add_stripe_billing` 適用。
- 2026-07-14: W4-03 完了。詳細検索化（targetGender hasSome / communityTypeId / joinMethod フィルタ）。BE repository+controller + FE types/API/UI 更新。
- 2026-07-14: W4-05 完了。サブコミュニティ権限伝播（membershipPropagation.ts ヘルパー新設）。7 UseCase 更新（CreateSub/Join/AcceptInvite/AddMember/ChangeRole/Leave/Remove）。findChildrenIds リポジトリ実装。propagateToChildren パラメータ追加。
- 2026-07-14: W4-08 完了。アクティビティパスをネスト型 `/communities/:communityId/activities/:id` に一斉切替。Router + 10+ ナビゲーション箇所 + BE ListMyChannelsUseCase に communityId 追加。
- 2026-07-14: W4-07 完了確認。決済連携（CASH/PayPay/Stripe）は既に全レイヤーで実装済み（12+ UseCase、ParticipationActionButton、StripePaymentModal、コミュニティ設定 UI、返金管理）。Stripe SDK v20 型エラーを修正（Invoice → Record<string, unknown> キャスト）。
