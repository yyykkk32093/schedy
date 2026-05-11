# [7] DB INDEX 付与状況確認

> 評価日: 2026-05-11
> 結論: **対応推奨。マスタテーブル + 一部 FK で INDEX 欠落あり。クエリ性能・運用安定性に直結**

## 現状サマリ

68 モデル中:

| 充実度                        | 件数  | 例                                                                                            |
| ----------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| Excellent（@@index 3 個以上） | 7     | Activity, Message, Payment, ParticipationAuditLog, Poll, Inquiry, InquiryAttachment           |
| Good（@@index 1〜2 個）       | 50+   | 大部分                                                                                        |
| **Poor（@@index 0 個）**      | **5** | **CategoryMaster, ParticipationLevelMaster, PlanMaster, OutboxRetryPolicy, OutboxDeadLetter** |

## 🔴 必須対応（FK / 検索用 INDEX 欠落）

| モデル                     | 欠落フィールド                    | 影響                                                                     | 行                                                           |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `CategoryMaster`           | INDEX 全くなし                    | マスタ参照（多数の FK 元）でフルスキャン                                 | [schema.prisma](../../../backend/prisma/schema.prisma#L924)  |
| `ParticipationLevelMaster` | INDEX 全くなし                    | 同上                                                                     | [schema.prisma](../../../backend/prisma/schema.prisma#L968)  |
| `PlanMaster`               | INDEX 全くなし                    | プラン参照でフルスキャン                                                 | [schema.prisma](../../../backend/prisma/schema.prisma#L1169) |
| `CommunityActivityDay`     | `communityId` の INDEX なし       | `@@unique([communityId, day])` の複合キーでカバー可だが range query 不利 | [schema.prisma](../../../backend/prisma/schema.prisma#L1010) |
| `CommunityTag`             | `communityId` の INDEX なし       | 同上                                                                     | [schema.prisma](../../../backend/prisma/schema.prisma#L1020) |
| `MessageReaction`          | `stampId`, `userId` の INDEX なし | スタンプ別/ユーザー別集計で性能劣化                                      | [schema.prisma](../../../backend/prisma/schema.prisma#L865)  |
| `HelpFeedback`             | `userId` の INDEX なし            | ユーザー別フィードバック取得で性能劣化                                   | [schema.prisma](../../../backend/prisma/schema.prisma#L1303) |
| `InquiryMessage`           | `authorUserId` の INDEX なし      | オペレーター割当検索で性能劣化                                           | [schema.prisma](../../../backend/prisma/schema.prisma#L1268) |

> 注: `@@unique([a, b])` は `WHERE a = ? AND b = ?` には効くが、`WHERE b = ?` 単独では使えない。複合 unique のみで個別 INDEX を省略すると検索パターンによって性能劣化する。

## 🟡 推奨対応（運用観点）

| モデル               | 検討すべき INDEX          | 理由                         |
| -------------------- | ------------------------- | ---------------------------- |
| `OutboxRetryPolicy`  | 不要（PK のみで十分）     | routingKey で常に lookup     |
| `OutboxDeadLetter`   | `failedAt` / `routingKey` | DLQ 監視・再処理での絞り込み |
| `PasswordCredential` | userId は PK 兼 FK        | OK                           |

## 🟢 良い設計事例

| モデル         | 工夫                                                         |
| -------------- | ------------------------------------------------------------ |
| `Place`        | `@@index([isActive, usageCount(sort)])` で人気地名を効率取得 |
| `Notification` | `@@index([userId, isRead, createdAt])` で未読一覧を高速化    |
| `Inquiry`      | sort 付き複合 INDEX で管理画面ソート最適化                   |
| `Message`      | `@@index([channelId, createdAt])` で時系列取得最適化         |

## 推奨アプローチ

### Phase 1: マスタ系の INDEX 補強（最優先）

```prisma
model CategoryMaster {
  // ... existing fields
  @@index([sortOrder])
  @@index([isActive])
}

model ParticipationLevelMaster {
  // ...
  @@index([sortOrder])
}

model PlanMaster {
  // ...
  @@index([isActive, sortOrder])
}
```

### Phase 2: FK INDEX の補完

```prisma
model CommunityActivityDay {
  // ...
  @@index([communityId])
}

model CommunityTag {
  // ...
  @@index([communityId])
}

model MessageReaction {
  // ...
  @@index([stampId])
  @@index([userId])
}

model HelpFeedback {
  // ...
  @@index([userId, createdAt])
}

model InquiryMessage {
  // ...
  @@index([authorUserId])
}
```

### Phase 3: 既存運用クエリの EXPLAIN 確認

本番 DB 接続情報から実際のスロークエリを抽出して INDEX 設計を最適化:

```sql
-- pg_stat_statements でスロークエリ抽出
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY total_exec_time DESC
LIMIT 30;

-- 個別クエリの確認
EXPLAIN ANALYZE SELECT * FROM "MessageReaction" WHERE "stampId" = '...';
```

### Phase 4: 検証

- 各 migration を local → staging → prod の順で適用
- マスタ系は INDEX 追加コストが軽い（テーブル小）ため即座に反映可
- 大きいテーブル（Message など）に追加する場合は `CONCURRENTLY` を検討

## 注意点

- **FK 列に INDEX がないと**、親テーブルの DELETE/UPDATE でフルスキャンが発生（PostgreSQL は FK 列に自動 INDEX を作らない）
- **Prisma migration は `CREATE INDEX` を非 CONCURRENT で生成** する。本番大規模テーブルでは手動で `CREATE INDEX CONCURRENTLY` の SQL に書き換える運用も検討

## 優先度

🔴 **High** — マスタの INDEX 欠落は今すぐ修正可能（リスク低・恩恵大）。
🟡 **Medium** — FK INDEX 追加は計画的に。
🟢 **Low** — pg_stat_statements 解析は継続的な運用タスク。

## 関連項目
- [4] PostgreSQL 慣習（同タイミングで migration 整理可能）
- 運用: pg_stat_statements 有効化と監視
