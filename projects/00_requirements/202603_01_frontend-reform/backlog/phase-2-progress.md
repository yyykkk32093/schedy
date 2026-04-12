# Backlog Phase 2: 繰り返しスケジュール + コミュニティ管理 + 基本画面 — 進捗

> **最終更新**: 2026-03-07
> **ステータス**: ✅ 完了
> **テーマ**: RecurrenceRule 実装 + コミュニティ運営強化 + マイページ / メンバー一覧 / アナウンス作成
> **前提条件**: FeatureGate（PREMIUM grade 制限）（UBL-9 のみ）

---

## タスク一覧

### 繰り返しスケジュール（統合タスク）

> 旧 FE BL-10（Repeat BE対応）+ 旧 BE「定例Schedule自動生成」を統合

| UBL   | タスク               | レイヤ   | ステータス | 備考               |
| ----- | -------------------- | -------- | ---------- | ------------------ |
| UBL-9 | 繰り返しスケジュール | DB/BE/FE | ✅ 完了     | 下記サブタスク参照 |

**サブタスク:**

| #   | サブタスク                                    | レイヤ   | ステータス | 備考                                                         |
| --- | --------------------------------------------- | -------- | ---------- | ------------------------------------------------------------ |
| 9-1 | RecurrenceRule 実装（rrule.js 活用）          | BE       | ✅ 完了     | RecurrenceRule VO 作成、Activity entity/repo 拡張            |
| 9-2 | cron ジョブ or Worker 拡張                    | BE/Infra | ✅ 完了     | startRecurrenceWorker.ts + GenerateRecurringSchedulesUseCase |
| 9-3 | Activity のデフォルト値 → Schedule へのコピー | BE       | ✅ 完了     | GenerateRecurringSchedulesUseCase で自動コピー               |
| 9-4 | PREMIUM grade 制限（FeatureGate）             | BE       | ✅ 完了     | activityRoutes.ts に条件付きミドルウェア追加                 |
| 9-5 | フロント Repeat Select UI 連携                | FE       | ✅ 完了     | repeatToRRule/rruleToRepeat 変換。API 送信連携完了           |

### コミュニティ設定（大幅拡張）

| UBL    | タスク                                       | レイヤ   | ステータス | 備考               |
| ------ | -------------------------------------------- | -------- | ---------- | ------------------ |
| UBL-10 | コミュニティ設定画面（権限・移譲・履歴含む） | DB/BE/FE | ✅ 完了     | 下記サブタスク参照 |

**サブタスク:**

| #    | サブタスク                                    | レイヤ   | ステータス | 備考                                                                            |
| ---- | --------------------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------- |
| 10-1 | コミュニティプロフィール編集                  | BE/FE    | ✅ 完了     | CommunitySettingsPage プロフィールセクション                                    |
| 10-2 | 集金設定（PayPay ID / enabledPaymentMethods） | BE/FE    | ✅ 完了     | Community entity/repo に追加。設定画面で編集可能                                |
| 10-3 | 権限設定                                      | DB/BE/FE | ✅ 完了     | ADMIN+制限。設定画面で権限別UI表示                                              |
| 10-4 | オーナー移譲                                  | BE/FE    | ✅ 完了     | ChangeMemberRoleUseCase + 設定画面Crown ボタン + AuditLog                       |
| 10-5 | 管理者昇格                                    | BE/FE    | ✅ 完了     | ChangeMemberRoleUseCase で対応。設定画面 Shield ボタン                          |
| 10-6 | メンバー強制退室                              | BE/FE    | ✅ 完了     | RemoveMemberUseCase + 設定画面 UserMinus ボタン                                 |
| 10-7 | 設定変更履歴                                  | DB/BE/FE | ✅ 完了     | CommunityAuditLog テーブル + ListAuditLogsUseCase + 設定画面 監査ログセクション |

**CommunityAuditLog テーブル設計:**

```
CommunityAuditLog
  ├── id: String @id @default(uuid())
  ├── communityId: String
  ├── actorUserId: String（変更した人）
  ├── action: CommunityAuditAction (enum)
  │   └── SETTINGS_UPDATED | ROLE_CHANGED | MEMBER_REMOVED | OWNER_TRANSFERRED
  ├── field: String?（変更フィールド名。例: "name", "visibility"）
  ├── before: String?（変更前値 JSON）
  ├── after: String?（変更後値 JSON）
  ├── summary: String（人間可読サマリ。例: "コミュニティ名を変更"）
  └── createdAt: DateTime
```

### メンバー招待機能（拡張）

| UBL    | タスク                                             | レイヤ   | ステータス | 備考               |
| ------ | -------------------------------------------------- | -------- | ---------- | ------------------ |
| UBL-11 | メンバー招待機能（LINE共有 + 招待ID + フロントUI） | DB/BE/FE | ✅ 完了     | 下記サブタスク参照 |

**サブタスク:**

| #    | サブタスク                 | レイヤ | ステータス | 備考                                                                      |
| ---- | -------------------------- | ------ | ---------- | ------------------------------------------------------------------------- |
| 11-1 | 招待トークン生成・検証 API | DB/BE  | ✅ 完了     | GenerateInviteTokenUseCase + AcceptInviteUseCase + InviteTokenテーブル    |
| 11-2 | LINE 共有連携              | FE     | 🔲 後回し   | navigator.share 対応は後日。現状はクリップボードコピーのみ                |
| 11-3 | 招待画面 UI                | FE     | ✅ 完了     | CommunitySettingsPage 招待リンクセクション + InviteAcceptPage             |
| 11-4 | 招待受諾フロー             | BE/FE  | ✅ 完了     | AcceptInviteUseCase + InviteAcceptPage （認証チェック→参加→リダイレクト） |
| 11-5 | 招待権限設定               | BE     | ✅ 完了     | ADMIN+のみ招待リンク生成可能                                              |

**LINE 共有の抽象化設計:**

```typescript
// 共有方法の Strategy パターン（将来の切り替えを容易に）
interface InviteShareStrategy {
  share(inviteUrl: string, communityName: string): Promise<void>;
}
// 実装: LineShareStrategy / WebShareStrategy / ClipboardShareStrategy
```

### マイページ（新規）

| UBL    | タスク                                    | レイヤ | ステータス | 備考               |
| ------ | ----------------------------------------- | ------ | ---------- | ------------------ |
| UBL-32 | マイページ（プロフィール設定 + 招待受諾） | BE/FE  | ✅ 完了     | 下記サブタスク参照 |

**サブタスク:**

| #    | サブタスク           | レイヤ | ステータス | 備考                                      |
| ---- | -------------------- | ------ | ---------- | ----------------------------------------- |
| 32-1 | マイページ画面 UI    | FE     | ✅ 完了     | MyPageコンポーネント + プロフィール編集   |
| 32-2 | プロフィール画像設定 | BE/FE  | ✅ 完了     | uploadFile 連携済み                       |
| 32-3 | 招待受諾 UI          | FE     | ✅ 完了     | InviteAcceptPage で招待リンクから参加可能 |

### メンバー一覧画面（新規）

| UBL    | タスク                       | レイヤ | ステータス | 備考                                                        |
| ------ | ---------------------------- | ------ | ---------- | ----------------------------------------------------------- |
| UBL-33 | メンバー一覧画面（表示のみ） | FE     | ✅ 完了     | MemberListPage + ListMembersUseCase拡張（ユーザー情報付き） |

**サブタスク:**

| #    | サブタスク            | レイヤ | ステータス | 備考                                                  |
| ---- | --------------------- | ------ | ---------- | ----------------------------------------------------- |
| 33-1 | メンバー一覧 UI       | FE     | ✅ 完了     | アバター + 名前 + ロール表示。MemberListPage 実装済み |
| 33-2 | メンバー一覧 API 連携 | FE     | ✅ 完了     | useMemberQueries + IUserRepository DI注入             |

### アナウンスメント作成画面（新規）

| UBL    | タスク                         | レイヤ | ステータス | 備考                             |
| ------ | ------------------------------ | ------ | ---------- | -------------------------------- |
| UBL-35 | アナウンスメント作成画面（FE） | FE     | ✅ 完了     | AnnouncementCreatePage + FAB統合 |

**サブタスク:**

| #    | サブタスク                     | レイヤ | ステータス | 備考                                                        |
| ---- | ------------------------------ | ------ | ---------- | ----------------------------------------------------------- |
| 35-1 | アナウンス作成フォーム UI      | FE     | ✅ 完了     | タイトル + 本文フォーム。管理者以上のみ作成ボタン表示       |
| 35-2 | アクティビティ作成との動線統合 | FE     | ✅ 完了     | FABメニューで「アナウンス作成」or「アクティビティ作成」選択 |

---

## 実装順序（推奨）

1. **UBL-32**（マイページ）— 既存 API 活用。FE 中心で工数小
2. **UBL-33**（メンバー一覧）— 既存 BE + FE のみ。最小工数
3. **UBL-35**（アナウンス作成画面）— 既存 BE + FE のみ
4. **UBL-10**（コミュニティ設定画面）— サブタスクが多いが段階的に実装可能
5. **UBL-11**（メンバー招待機能）— UBL-10（権限設定）+ UBL-32（招待受諾）に依存
6. **UBL-9**（繰り返しスケジュール）— 最大工数。rrule.js 導入 → cron/Worker → FeatureGate の順

---

## 技術メモ

- **rrule.js**: RFC 5545 準拠の繰り返しルール処理ライブラリ。`backend/` に `npm install rrule` で導入
- **cron ジョブ**: 既存の `backend/src/job/` ディレクトリ配下に Worker を追加。Outbox パターンとの整合性を確認
- **FeatureGate**: 既存の Plan / Grade 判定ロジックを活用（PREMIUM grade のコミュニティのみ）
- **招待トークン**: UUID ベースの一意トークンを生成し、有効期限1日で DB 管理。招待リンク or LINE 共有
- **UBL-10 集金設定**: コミュニティ設定画面に「PayPay ID」入力欄と「有効な支払い方法」チェックボックス（CASH / PAYPAY / STRIPE）を配置。DB カラムは Backlog Phase 1 の UBL-8 で追加済みの `Community.payPayId` / `Community.enabledPaymentMethods` を使用
- **CommunityAuditLog**: Outbox とは責務分離。ユーザー向け履歴表示 + 永続保持が目的。Outbox は外部イベント配信用
- **LINE 共有**: `navigator.share` を優先。非対応ブラウザは `line://msg/text/` URL Scheme にフォールバック。Strategy パターンで将来の共有手段追加に対応
- **メンバー一覧**: 表示のみ。管理者操作（ロール変更・強制退室）はコミュニティ設定画面（UBL-10）に集約

---

## 作業ログ

- 2026-03-04: バックログ統合時に Backlog Phase 2 として編成（旧 FE BL-7, BL-9, BL-10 + 旧 BE 定例Schedule自動生成）
- 2026-03-05: UBL-10（コミュニティ設定画面）に集金設定（PayPay ID / enabledPaymentMethods）を追記。支払い機能設計の決定に伴い
- 2026-03-06: 新規要件統合。UBL-10 を大幅拡張（権限設定・オーナー移譲・管理者昇格・強制退室・設定変更履歴）。UBL-11 を拡張（LINE共有 + 招待ID + 権限設定連携）。UBL-32（マイページ）・UBL-33（メンバー一覧）・UBL-35（アナウンス作成画面）を新規追加
- 2026-03-07: **Phase 2 全タスク実装完了** 🎉
  - UBL-32 BE+FE: MyPage プロフィール編集
  - UBL-33 BE+FE: MemberList（ユーザー情報付きメンバー一覧）+ ListMembersUseCase に IUserRepository DI 注入
  - UBL-35 FE: AnnouncementCreatePage + FAB 統合
  - UBL-10 DB: CommunityAuditLog + InviteToken テーブル migration
  - UBL-10 BE: UpdateCommunity 拡張（payPayId/enabledPaymentMethods/auditLog）、ChangeMemberRole 拡張（auditLog）、RemoveMemberUseCase、ListAuditLogsUseCase、API routes
  - UBL-10 FE: CommunitySettingsPage（プロフィール/支払い/招待/メンバー管理/監査ログの5セクション）
  - UBL-11 BE: GenerateInviteTokenUseCase、AcceptInviteUseCase、InviteTokenRepository、API routes
  - UBL-11 FE: InviteAcceptPage、設定画面の招待セクション
  - UBL-9 BE: rrule ^2.8.1 導入、RecurrenceRule VO、Activity entity/repo 拡張、CreateActivity/UpdateActivity UseCase 拡張、GenerateRecurringSchedulesUseCase、startRecurrenceWorker
  - UBL-9 BE: FeatureGate 統合（AUTO_SCHEDULE 条件付きミドルウェア for create/update routes）
  - UBL-9 FE: ActivityForm の Repeat Select → RRULE 文字列変換、Create/Edit ページで recurrenceRule API 送信
  - tsc ビルドチェック: バックエンド ✅ フロントエンド ✅
