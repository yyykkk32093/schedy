# Phase 3 — 通知情報拡充 + コミュニティ作成(複数場所) + 退会理由

> **最終更新**: 2026-03-22
> **ステータス**: ✅ Phase 3 完了

## フェーズ概要
- **ゴール**: BE変更（API拡張・DB変更）を伴う中〜大規模タスクを消化する。通知システムの情報拡充、コミュニティ活動場所の複数入力対応、退会理由収集フローの新設
- **対象**: C-20/21/22/23（通知情報拡充）, C-12（複数場所入力）, C-25（退会理由）
- **変更対象レイヤー**: UI / API / UseCase / Domain / DB
- **規模**: L（4件。DB変更2件を含む）

## タスク一覧

| タスク                                            | 状態   | 備考                                                                        |
| ------------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| C-20/21/22/23 通知一覧の情報拡充                  | ✅ 完了 | NotificationMetadata Zod型 + 全16箇所にmetadata埋め込み + APIレスポンス拡張 |
| C-12 コミュニティ作成 — 活動場所/主要駅の複数入力 | ✅ 完了 | CommunityLocation BE(CRUD API) + FE(MetaSection表示 + LocationSettings編集) |
| C-25 退会理由入力フロー                           | ✅ 完了 | UserWithdrawal BE(Repository+UseCase) + FE(理由選択ラジオ+テキスト)         |

---

## C-20/21/22/23 通知一覧の情報拡充

- **分類**: 改善
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / DB
- **由来**: wave3レビュー [20][21][22][23]
- **依存**: なし

### 現状
- 通知は `title` + `body`（オプション）+ `createdAt` のみ
- アクティビティ詳細へのリンク・詳細情報なし
- タイプチップのみの表示で情報が不足

### 設計判断（✅ 確定 2026-03-21）
- **D-1: 通知データの拡張方式 → a) `metadata` JSON カラム追加**
  - Notification テーブルに `metadata: Json?` カラムを追加
  - 通知タイプごとに異なるデータを柔軟に格納
  - Phase 5+（W4-07 決済通知、W4-05 サブコミュニティ通知等）でも同じパターンを踏襲

- **D-1 型設計: 共通ドメイン型 + Zod スキーマ**
  - TypeScript Discriminated Union で型安全を担保
  - **BE に Zod を新規導入**（Phase 3 では metadata バリデーション限定。API全体のバリデーション基盤はバックログ）
  - BE: Zod で書き込み時バリデーション（UseCase層）
  - FE: Zod で読み出し時バリデーション（既に Zod 導入済み）
  - 詳細: `backend/docs/validation/validation-strategy.md` 参照

- **D-1 FE/BE 型共有方式: BE/FE で同等型を各自定義**
  - BE の `_sharedDomains/` に定義。FE は API レスポンス型として同等の型を定義
  - 現行の FE/BE 分離アーキテクチャを維持

- **リンク生成 → a) FEで通知タイプ+metadataからURLを組み立て**
  - URLはフロントルーティングに依存するためFE側で組み立て
  - ルーティング変更時の影響をBEに波及させない

- **既存通知の互換性 → a) 既存通知は旧表示のまま**
  - `metadata` が null の場合は従来通り `body` のみ表示
  - 新規通知から metadata 付き

### 仕様

#### DBスキーマ変更
```
// Notification テーブルにカラム追加
metadata  Json?  // 通知タイプごとのメタデータ
```

#### 通知タイプ別メタデータ定義

```typescript
type NotificationMetadata =
  | { type: 'WAITLIST_PROMOTED'; activityId: string; activityName: string; scheduleDate: string }
  | { type: 'SAME_DAY_CANCEL'; activityId: string; cancelledByName: string; scheduleDate: string }
  | { type: 'REFUND_REQUIRED'; activityId: string; targetUserName: string; amount: number }
  | { type: 'ACTIVITY_CANCELLED'; activityId: string; activityName: string; scheduleDate: string }
  | { type: 'PARTICIPATION_CONFIRMED'; activityId: string; activityName: string; scheduleDate: string }
  | { type: 'ACTIVITY_REMINDER'; activityId: string; activityName: string; scheduleDate: string }
  | { type: 'PAYMENT_REQUEST'; activityId: string; activityName: string; amount: number }
  | { type: 'COMMUNITY_JOINED'; communityId: string; communityName: string }
```

#### 各通知タイプの追加表示情報

| 通知タイプ                          | 追加表示情報                                                             |
| ----------------------------------- | ------------------------------------------------------------------------ |
| WAITLIST_PROMOTED（繰上げ）         | アクティビティ名・スケジュール日時・詳細リンク                           |
| SAME_DAY_CANCEL（当日キャンセル）   | キャンセルしたユーザー名・アクティビティ名・スケジュール日時・詳細リンク |
| REFUND_REQUIRED（返金）             | 対象ユーザー名・返金額・アクティビティ名・詳細リンク                     |
| ACTIVITY_CANCELLED（開催取消）      | アクティビティ名・スケジュール日時                                       |
| PARTICIPATION_CONFIRMED（参加確定） | アクティビティ名・スケジュール日時・詳細リンク                           |
| ACTIVITY_REMINDER（リマインド）     | アクティビティ名・スケジュール日時・詳細リンク                           |
| PAYMENT_REQUEST（支払い）           | アクティビティ名・金額・詳細リンク                                       |
| COMMUNITY_JOINED 等                 | コミュニティ名・リンク                                                   |

### 実装ステップ

| Step | 内容                                                          | 対象レイヤー    |
| ---- | ------------------------------------------------------------- | --------------- |
| 1    | Prismaマイグレーション（Notification に metadata Json? 追加） | DB              |
| 2    | NotificationMetadata 型定義（Discriminated Union）            | Domain / Shared |
| 3    | 各通知作成箇所で metadata を埋め込むように修正                | UseCase         |
| 4    | 通知一覧APIのレスポンスに metadata を含める                   | API             |
| 5    | FE: 通知タイプ別レンダラー + metadata からリンク生成          | UI              |
| 6    | FE: 各通知カードのデザイン調整（詳細情報表示）                | UI              |

### 受入条件
- 各通知タイプに応じた詳細情報（アクティビティ名・日時・金額等）が表示されること
- アクティビティ詳細・コミュニティ詳細への遷移リンクが機能すること
- `metadata` が null の既存通知は従来通りの表示であること
- 型安全な Discriminated Union で metadata がハンドリングされること

### 関連ファイル（推定）
- `backend/prisma/schema.prisma` — Notification モデルに metadata 追加
- `backend/src/application/` — 各通知作成UseCase（metadata 埋め込み）
- `backend/src/api/front/notification/` — 通知一覧APIレスポンス拡張
- `frontend/src/features/notification/` — 通知一覧・カードコンポーネント
- `frontend/src/shared/types/` — NotificationMetadata 型定義

---

## C-12 コミュニティ作成 — 活動場所/主要駅の複数入力

- **分類**: 機能拡張
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **由来**: wave3レビュー [12]
- **依存**: なし

### 現状
- `activityLocation`（String?）/ `nearestStation`（String?）— 単一フィールド

### 設計判断（✅ 確定 2026-03-21）
- **D-2: DB設計 → b) 別テーブル `CommunityLocation` を新設（1:N）**
  - 正規化テーブル。将来の検索（W4-03）でインデックスが効く
  - `CommunityLocation { id, communityId, type(MAIN/SUB), location, station, sortOrder }`
  - W4-01（ウィザード詳細設定）、W4-03（詳細検索）でも活用される設計

- **D-2 旧カラムの扱い → 即時削除**
  - 同一マイグレーションで ①新テーブル作成 ②データ移行 ③旧カラム削除 を実行
  - データソースを一元化し、旧カラムとの不整合リスクを排除
  - ※ 妥協設計（旧カラム残置）は採用しない

- **D-2 type 設計 → MAIN/SUB enum 維持**
  - `LocationType { MAIN | SUB }` enum でメイン/サブを明示的に表現
  - `sortOrder` は並び順専用。「メインかサブか」というビジネス上の意味は `type` で表す

- **活動場所の最大数制限 → BE + FE 両方でバリデーション**
  - FE: `maxLocations=3` で `+` ボタンを非表示
  - BE: UseCase 層で件数バリデーション（不正リクエスト防御）

- **UI操作 → a) `+` ボタンでフィールド追加**
  - メインは必ず表示、サブはある場合にのみ＋ボタンで追加
  - 最大3つまで（メイン + サブ × 2）

### 仕様

#### DBスキーマ変更
```prisma
model CommunityLocation {
  id            String    @id @default(cuid())
  communityId   String
  type          LocationType  // MAIN | SUB
  location      String?
  station       String?
  sortOrder     Int       @default(0)
  community     Community @relation(fields: [communityId], references: [id])

  @@index([communityId])
}

enum LocationType {
  MAIN
  SUB
}
```

#### データ移行（旧カラム即時削除）
- マイグレーション SQL で既存の Community レコードから `CommunityLocation` にデータをコピー
- `activityLocation` が非null → `CommunityLocation` に `type=MAIN, location=activityLocation, station=nearestStation` で INSERT
- 同一マイグレーション内で旧カラム（`activityLocation`, `nearestStation`）を削除

#### フロントUI
- コミュニティ作成/編集フォームに `+` ボタン付きの場所入力セクション
- メイン場所: 常時表示（場所 + 最寄駅）
- サブ場所: `+ 場所を追加` ボタンで最大2つまで追加
- 各サブ場所に `×` ボタンで削除可能

### 実装ステップ

| Step | 内容                                                        | 対象レイヤー   |
| ---- | ----------------------------------------------------------- | -------------- |
| 1    | Prismaマイグレーション（CommunityLocation テーブル新設）    | DB             |
| 2    | 既存データ移行SQL                                           | DB             |
| 3    | CommunityLocation ドメインモデル・リポジトリ                | Domain / Infra |
| 4    | コミュニティ作成/更新UseCase に CommunityLocation CRUD 追加 | UseCase        |
| 5    | API レスポンスに CommunityLocation を含める                 | API            |
| 6    | FE: `+` ボタン付きフォームUI                                | UI             |
| 7    | FE: コミュニティ詳細での複数場所表示（C-13 と連携）         | UI             |

### 受入条件
- コミュニティ作成/編集で最大3つまで場所/駅を入力できること
- メイン場所は常時表示、サブは `+` ボタンで追加できること
- 既存の単一場所データが新テーブルに正しく移行されていること
- コミュニティ詳細画面で複数場所が表示されること

### 関連ファイル（推定）
- `backend/prisma/schema.prisma` — CommunityLocation モデル新設
- `backend/src/domains/community/` — CommunityLocation ドメインモデル
- `backend/src/application/community/usecase/` — 作成/更新UseCase拡張
- `backend/src/api/front/community/` — APIレスポンス拡張
- `frontend/src/features/community/` — 作成/編集フォーム

---

## C-25 退会理由入力フロー

- **分類**: 機能拡張
- **優先度**: P3
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / DB
- **由来**: wave3レビュー [25]
- **依存**: なし

### 現状
- 確認ダイアログのみで即退会実行

### 設計判断（✅ 確定 2026-03-21）
- **DB保存 → b) 別テーブル `WithdrawalLog`**
  - `WithdrawalLog { id, userId, reason(enum), freeText?, withdrawnAt }` を新設
  - 分析に利用可能

- **自由記述 → b) 選択 + 自由記述（任意）**
  - 「その他」選択時に自由記述テキストエリアを表示

- **D-3: 退会理由の選択肢 → 確定**
  - 以下の5項目で確定。追加・削除が行いやすい実装にすること
    1. `NO_LONGER_USED` — 使わなくなった
    2. `FEATURE_DISSATISFACTION` — 機能に不満がある
    3. `SWITCHED_SERVICE` — 別のサービスに移行した
    4. `TEMPORARY_PAUSE` — 一時的に利用を停止したい
    5. `OTHER` — その他（自由記述）

### 仕様

#### 退会フロー
```
退会ボタン → 退会理由選択画面 → 確認ダイアログ → 退会実行
```

#### DBスキーマ変更
```prisma
model WithdrawalLog {
  id           String   @id @default(cuid())
  userId       String
  reason       WithdrawalReason
  freeText     String?
  withdrawnAt  DateTime @default(now())

  @@index([withdrawnAt])
}

enum WithdrawalReason {
  NO_LONGER_USED
  FEATURE_DISSATISFACTION
  SWITCHED_SERVICE
  TEMPORARY_PAUSE
  OTHER
}
```

#### フロントUI
- 退会ボタン押下 → 退会理由選択画面（ラジオボタン）に遷移
- 「その他」選択時にテキストエリアが表示される
- 理由選択後、「退会する」ボタン → 最終確認ダイアログ → 退会実行

### 実装ステップ

| Step | 内容                                                    | 対象レイヤー |
| ---- | ------------------------------------------------------- | ------------ |
| 1    | Prismaマイグレーション（WithdrawalLog テーブル + enum） | DB           |
| 2    | 退会UseCase に WithdrawalLog 記録ロジック追加           | UseCase      |
| 3    | 退会API に reason / freeText パラメータ追加             | API          |
| 4    | FE: 退会理由選択画面コンポーネント新設                  | UI           |
| 5    | FE: マイページ退会フローの導線変更                      | UI           |

### 受入条件
- 退会ボタン押下で退会理由選択画面に遷移すること
- ラジオボタンで理由を選択できること
- 「その他」選択時に自由記述テキストエリアが表示されること
- 退会実行後に WithdrawalLog レコードが作成されること
- 退会機能自体は従来通り動作すること（W3-07 の退会処理）

### 関連ファイル（推定）
- `backend/prisma/schema.prisma` — WithdrawalLog モデル + WithdrawalReason enum
- `backend/src/application/user/usecase/` — 退会UseCase拡張
- `backend/src/api/front/user/` — 退会APIパラメータ拡張
- `frontend/src/features/user/pages/MyPage.tsx` — 退会フロー導線
- `frontend/src/features/user/` — 退会理由選択画面（新設）

---

## 作業ログ
- 2026-03-20: Phase 3 作成。3件（通知情報拡充・複数場所入力・退会理由）を計画。設計判断を確定（D-1: metadata Json?方式、D-2: CommunityLocationテーブル新設、D-3: 退会理由選択肢は要確認）。横断的設計判断（wave4-overview D-1〜D-3）を反映。
- 2026-03-21: 設計判断すり合わせ完了。D-1: Zod+Discriminated Union確定（BEにZod新規導入、metadata限定）、D-2: 旧カラム即時削除+MAIN/SUB enum維持、D-3: 退会理由選択肢確定（5項目）、C-12: BE+FE両方で件数バリデーション。バリデーション設計方針を `backend/docs/validation/validation-strategy.md` に文書化。
- 2026-03-22: Phase 3 全タスク実装完了。
  - C-20/21/22/23: NotificationMetadata.ts (Zod v4) 作成、INotificationRepository/Impl/Service にmetadata追加、全16通知作成箇所にmetadata埋め込み、APIレスポンスにmetadata追加
  - C-12: ICommunityLocationRepository + Impl (CRUD + replaceAll)、communityLocationRoutes (GET/PUT/POST/DELETE)、CommunityDetail型にlocations追加、FE MetaSection表示 + LocationSettings編集コンポーネント
  - C-25: IUserWithdrawalRepository + Impl (upsert)、DeleteUserUseCase にreason/freeText追加、userController更新、FE退会ダイアログに理由選択ラジオ+テキストエリア追加
