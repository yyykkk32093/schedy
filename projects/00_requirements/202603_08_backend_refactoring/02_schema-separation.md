# [2] DB スキーマ分離（master系 / domain 観点）

> 評価日: 2026-05-11
> 結論: **現時点では Low Priority（実装するメリットが小さい）。命名 prefix での論理分割を推奨**

## 現状調査

- 全 **68 モデル** が単一の `public` スキーマに配置されている
- `@@schema` ディレクティブの使用: **0 件**
- Prisma の `previewFeatures = ["multiSchema"]` も未設定

## モデル分類（論理グループ）

| グループ                                                             | 件数 | 代表モデル                                                                                                                                                                                   |
| -------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outbox / Integration                                                 | 3    | `OutboxEvent`, `OutboxRetryPolicy`, `OutboxDeadLetter`                                                                                                                                       |
| Audit                                                                | 4    | `AuthAuditLog`, `CommunityAuditLog`, `ParticipationAuditLog`, `WaitlistAuditLog`                                                                                                             |
| Auth / User                                                          | 9    | `User`, `PasswordCredential`, `Google/Line/AppleCredential`, `AuthSecurityState`, `UserWithdrawal`, `UserFeatureRestriction`, `UserLimitRestriction`                                         |
| Community Core                                                       | 7    | `Community`, `CommunityMembership`, `CommunityLocation`, `CommunityJoinRequest`, `CommunityBookmark`, `CommunityFeatureRestriction`, `CommunityLimitRestriction`                             |
| Master / Lookup                                                      | 9    | `CategoryMaster`, `ParticipationLevelMaster`, `PlanMaster`, `ExpenseCategory`, `InquiryCategory`, `CommunityCategory`, `CommunityParticipationLevel`, `CommunityActivityDay`, `CommunityTag` |
| Activity / Schedule                                                  | 5    | `Activity`, `Schedule`, `Place`, `Participation`, `WaitlistEntry`                                                                                                                            |
| Payment                                                              | 1    | `Payment`                                                                                                                                                                                    |
| Chat / Message                                                       | 7    | `ChatChannel`, `Message`, `MessageAttachment`, `MessageReaction`, `DMParticipant`, `Stamp`, `ChannelReadState`                                                                               |
| Announcement / Poll                                                  | 9    | `Announcement`, `AnnouncementRead/Like/Comment/Attachment/Bookmark`, `Poll`, `PollOption`, `PollVote`                                                                                        |
| Album / Webhook / Notification / Inquiry / Help / Matching / Expense | 残り | —                                                                                                                                                                                            |

## 評価

### スキーマ分離のメリット
- 権限管理の粒度向上（例: `master` 読み取り専用ロールを切る）
- バックアップ/リストアの単位を細かく
- 名前空間整理（巨大化したときの可読性）
- マルチテナント設計への布石

### スキーマ分離のデメリット
- Prisma の `multiSchema` は preview feature → migration 運用が複雑化
- 既存の全 68 テーブルに `@@schema(...)` 追加 → migration 1 本で巨大変更
- クロススキーマ参照（FK）はサポートされるが ORM ツール・GUI の対応がまだ薄い
- 開発者の ergonomic コスト（DBクライアント設定、search_path）

### 結論
- **現状 68 モデルでは分離による実利が小さい**
- 単一スキーマでも「論理グループ」を Prisma model 命名 prefix（`Auth*`, `Community*`, `Master*`）で表現可能
- スキーマ分離は **100モデル超** または **権限分離が業務要件として発生** したタイミングで再検討

## 推奨アプローチ（現時点で実施するなら）

### 案A: 命名 prefix 統一（軽量・推奨）
- マスタ系: `XxxMaster` に統一（→ [3] とセット）
- Outbox/Integration 系: `Outbox*`, `Integration*`
- Audit 系: `*AuditLog`
- 既に prefix 規則がある箇所（`Community*`, `Announcement*`）は維持

実施コスト: 低（モデル名変更 → Prisma migration の `@@map` で旧テーブル名維持可能）

### 案B: マルチスキーマ採用（重量・将来）
段階的に以下を分離する：
1. `outbox` スキーマ — Outbox / DLQ / 監査ログ
2. `master` スキーマ — マスタ系 9 モデル
3. `app` スキーマ — その他（デフォルト）

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["app", "master", "outbox"]
}

model CategoryMaster {
  // ...
  @@schema("master")
}
```

実施コスト: 高（migration 1 本で全テーブル書き換え、本番停止枠が必要）

## 優先度

🟢 **Low** — 案A（命名統一）は [3]/[4] と統合実施。案B（マルチスキーマ）は将来的判断。

## 関連項目
- [3] マスターテーブル命名 → `Master` suffix 統一
- [4] テーブル名 PostgreSQL 慣習 → `@@map` で snake_case 化
