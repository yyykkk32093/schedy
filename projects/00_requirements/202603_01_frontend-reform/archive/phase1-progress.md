# 📋 Phase 1 実装進捗トラッカー

> **最終更新**: 2026-02-10
> **ベース**: [memo.md](memo.md) の Phase 1 計画
> **対象**: コアドメイン（Community + Activity + Schedule）
> **ステータス**: ✅ Phase 1 完了

---

## Phase 0: 基盤整備 ✅ 完了

| タスク                                                    | 状態   | 備考                                    |
| --------------------------------------------------------- | ------ | --------------------------------------- |
| Outbox エラーハンドリング強化（Error Taxonomy / DLQ拡張） | ✅ 完了 | IntegrationError 階層, DLQ スキーマ拡張 |
| API層の共通例外ハンドリング middleware                    | ✅ 完了 | errorHandler + DomainValidationError    |
| User エンティティに plan 追加、role 廃止                  | ✅ 完了 | UserPlan VO（FREE/SUBSCRIBER/LIFETIME） |
| 既存 Activity エンティティの移行準備                      | ✅ 完了 | ActivityRepository DI 化 + upsert       |

---

## Phase 1: コアドメイン ✅ 完了

### 1-1. Community エンティティ ✅ 完了

| タスク                                                            | 状態     | 備考                                      |
| ----------------------------------------------------------------- | -------- | ----------------------------------------- |
| Prisma スキーマ（Community テーブル）                             | ✅ 完了   | 自己参照リレーション含む                  |
| 再帰構造（parentId, depth）                                       | ✅ 完了   | Entity に `createChild()` + `MAX_DEPTH=3` |
| grade: FREE \| PREMIUM                                            | ✅ 完了   | CommunityGrade VO                         |
| ValueObject（CommunityId, Name, Description, Grade）              | ✅ 完了   |                                           |
| Community エンティティ（create, reconstruct, update, softDelete） | ✅ 完了   |                                           |
| CommunityCreatedEvent + Subscriber                                | ✅ 完了   | DomainEventBus 登録済み                   |
| ICommunityRepository + CommunityRepositoryImpl                    | ✅ 完了   | DI 対応, upsert                           |
| CRUD API（POST/GET/PATCH/DELETE /v1/communities）                 | ✅ 完了   | authMiddleware 付き                       |
| UseCases（Create, Find, List, Update, SoftDelete）                | ✅ 完了   |                                           |
| Community の `logoUrl` / `coverUrl`                               | 🔜 後回し | PREMIUM 機能（Phase 3 で追加予定）        |

### 1-2. CommunityMembership ✅ 完了

| タスク                                                  | 状態   | 備考                                                 |
| ------------------------------------------------------- | ------ | ---------------------------------------------------- |
| Prisma スキーマ（CommunityMembership テーブル）         | ✅ 完了 | `@@unique([communityId, userId])`                    |
| role: OWNER \| ADMIN \| MEMBER                          | ✅ 完了 | MembershipRole VO                                    |
| CommunityMembership エンティティ                        | ✅ 完了 | create, changeRole, leave                            |
| 参加 API（POST /v1/communities/:id/members）            | ✅ 完了 | OWNER/ADMIN のみ追加可                               |
| 脱退 API（DELETE /v1/communities/:id/members/me）       | ✅ 完了 | OWNER 脱退禁止（ドメインエラー）                     |
| OWNER 委譲（PATCH /v1/communities/:id/members/:userId） | ✅ 完了 | 同一 Tx で旧 OWNER → ADMIN 降格                      |
| メンバー一覧 API（GET /v1/communities/:id/members）     | ✅ 完了 |                                                      |
| grade 連動ロジック（CommunityGradePolicy）              | ✅ 完了 | ドメインサービス。plan.isPaid() → PREMIUM, else FREE |
| サブコミュニティ作成 API                                | ✅ 完了 | POST /v1/communities/:parentId/children, OWNERのみ   |

**CommunityGradePolicy 実装詳細:**
- `CommunityGradePolicy.gradeFromPlan(plan)` … 静的メソッド
- `CreateCommunityUseCase` … 作成時にOWNERのplanからgrade自動決定
- `ChangeMemberRoleUseCase` … OWNER委譲時、新OWNERのplanからgrade再評価
- `Community.changeGrade(newGrade)` … エンティティにgrade変更メソッド追加

### 1-3. Activity 再設計 ✅ 完了

| タスク                                                         | 状態   | 備考                                                            |
| -------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| Community 紐づけ（`communityId` 追加）                         | ✅ 完了 |                                                                 |
| `defaultLocation` / `defaultStartTime` / `defaultEndTime` 追加 | ✅ 完了 | TimeOfDay VO（HH:mm形式）                                       |
| 論理削除化（`deletedAt` 追加, `status` 廃止）                  | ✅ 完了 |                                                                 |
| `recurrenceRule`（Phase 1 では null 固定）                     | ✅ 完了 | フィールド定義のみ、値は常にnull                                |
| Prisma スキーマ再設計                                          | ✅ 完了 | 破壊的変更 → `migrate reset` 実施済み                           |
| Activity エンティティ再設計                                    | ✅ 完了 | `domains/activity/`に新設（旧`domains/schedule/activity/`削除） |
| Activity CRUD API                                              | ✅ 完了 | 5エンドポイント                                                 |
| UseCases 再設計                                                | ✅ 完了 | Create, Find, List, Update, SoftDelete                          |

**ディレクトリ構成:**
- ドメイン: `backend/src/domains/activity/`
- アプリケーション: `backend/src/application/activity/`
- API: `backend/src/api/front/activity/`
- 旧 `domains/schedule/activity/` は削除済み

### 1-4. Schedule ✅ 完了

| タスク                               | 状態   | 備考                                           |
| ------------------------------------ | ------ | ---------------------------------------------- |
| Prisma スキーマ（Schedule テーブル） | ✅ 完了 | activityId, date, startTime, endTime, capacity |
| Schedule エンティティ + VOs          | ✅ 完了 | ScheduleId, ScheduleStatus, ScheduleCapacity   |
| capacity（定員）+ isFull 算出        | ✅ 完了 | `isFull(currentAttendingCount)` メソッド       |
| status: SCHEDULED \| CANCELLED       | ✅ 完了 | ScheduleStatus VO                              |
| CRUD API                             | ✅ 完了 | 5エンドポイント（cancel は専用エンドポイント） |
| UseCases                             | ✅ 完了 | Create, Find, List, Update, Cancel             |

**ディレクトリ構成:**
- ドメイン: `backend/src/domains/activity/schedule/`（Activityの子として正しい階層）
- アプリケーション: `backend/src/application/schedule/`
- API: `backend/src/api/front/schedule/`

### 1-5. Participation + WaitlistEntry ✅ 完了

| タスク                                                       | 状態   | 備考                                                               |
| ------------------------------------------------------------ | ------ | ------------------------------------------------------------------ |
| Prisma スキーマ（Participation, WaitlistEntry）              | ✅ 完了 | `@@unique([scheduleId, userId])` 両方                              |
| Participation エンティティ（ATTENDING / CANCELLED）          | ✅ 完了 | cancel(), reattend(), isAttending()                                |
| WaitlistEntry エンティティ（WAITING / PROMOTED / CANCELLED） | ✅ 完了 | promote(), cancel(), isWaiting()                                   |
| 参加表明 / キャンセル API                                    | ✅ 完了 | POST/DELETE /v1/schedules/:id/participations                       |
| キャンセル待ち登録 / 辞退 API                                | ✅ 完了 | POST/DELETE /v1/schedules/:id/waitlist-entries                     |
| 自動繰り上げ                                                 | ✅ 完了 | CancelParticipationUseCase内で同一TX内自動繰り上げ（Phase1簡易版） |
| isFull 算出                                                  | ✅ 完了 | Schedule.isFull() + AttendScheduleUseCase で判定                   |

**自動繰り上げ実装:**
- Phase 1 ではApplicationEvent方式ではなく、CancelParticipationUseCase内で同一トランザクション内に処理（簡易版）
- キャンセル → position=1 & status=WAITING の WaitlistEntry を取得 → promote() → 新Participation作成
- 将来的にApplicationEvent（ParticipationCancelledEvent → WaitlistPromotionSubscriber）に移行可能

**ディレクトリ構成:**
- Participation: `backend/src/domains/activity/schedule/participation/`
- WaitlistEntry: `backend/src/domains/activity/schedule/waitlist/`
- アプリケーション: `backend/src/application/participation/`
- API: `backend/src/api/front/participation/`

---

## memo.md にない追加作業（Phase 1 計画中に追加決定）

| タスク                                          | 状態   | 背景                                                                         |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Express Request 型拡張（`express.d.ts`）        | ✅ 完了 | `(req as any).user` の型安全化。Phase 1 の authMiddleware 全面適用に伴い追加 |
| CommunityCreatedEvent → Outbox 連携（監査ログ） | ✅ 完了 | IntegrationEventFactory に `community.created` → `audit.log` 変換を追加      |
| TimeOfDay 共通VO                                | ✅ 完了 | HH:mm形式の時刻VO。Activity/Schedule両方で使用                               |

---

## REST API エンドポイント進捗

### ✅ 実装済み

| メソッド | パス                                      | 機能                              |
| -------- | ----------------------------------------- | --------------------------------- |
| POST     | `/v1/communities`                         | コミュニティ作成                  |
| GET      | `/v1/communities`                         | 自分がメンバーのコミュニティ一覧  |
| GET      | `/v1/communities/:id`                     | コミュニティ詳細                  |
| PATCH    | `/v1/communities/:id`                     | コミュニティ更新（OWNER のみ）    |
| DELETE   | `/v1/communities/:id`                     | コミュニティ削除（OWNER のみ）    |
| POST     | `/v1/communities/:parentId/children`      | サブコミュニティ作成（OWNERのみ） |
| POST     | `/v1/communities/:id/members`             | メンバー追加                      |
| GET      | `/v1/communities/:id/members`             | メンバー一覧                      |
| PATCH    | `/v1/communities/:id/members/:userId`     | ロール変更 / OWNER 委譲           |
| DELETE   | `/v1/communities/:id/members/me`          | 脱退                              |
| POST     | `/v1/communities/:communityId/activities` | Activity 作成                     |
| GET      | `/v1/communities/:communityId/activities` | Activity 一覧                     |
| GET      | `/v1/activities/:id`                      | Activity 詳細                     |
| PATCH    | `/v1/activities/:id`                      | Activity 更新                     |
| DELETE   | `/v1/activities/:id`                      | Activity 削除（論理）             |
| POST     | `/v1/activities/:activityId/schedules`    | Schedule 作成                     |
| GET      | `/v1/activities/:activityId/schedules`    | Schedule 一覧                     |
| GET      | `/v1/schedules/:id`                       | Schedule 詳細                     |
| PATCH    | `/v1/schedules/:id`                       | Schedule 更新                     |
| PATCH    | `/v1/schedules/:id/cancel`                | Schedule キャンセル               |
| POST     | `/v1/schedules/:id/participations`        | 参加表明                          |
| DELETE   | `/v1/schedules/:id/participations/me`     | 参加キャンセル                    |
| POST     | `/v1/schedules/:id/waitlist-entries`      | キャンセル待ち登録                |
| DELETE   | `/v1/schedules/:id/waitlist-entries/me`   | キャンセル待ち辞退                |

---

## Prismaマイグレーション履歴

| マイグレーション名                                                     | 内容                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `20260210103427_add_community_and_membership`                          | Community + CommunityMembership テーブル追加              |
| `20260210112443_redesign_activity_add_schedule_participation_waitlist` | Activity再設計 + Schedule/Participation/WaitlistEntry追加 |

---

## ビルド・テスト検証

| 検証項目             | 結果                   | 日時       |
| -------------------- | ---------------------- | ---------- |
| `tsc --noEmit`       | ✅ エラーなし           | 2026-02-10 |
| `vitest run`         | ✅ 26 passed, 1 skipped | 2026-02-10 |
| `prisma migrate dev` | ✅ 成功                 | 2026-02-10 |

---

## 次のフェーズ

Phase 1 完了。Phase 2（コミュニケーション）へ進行可能。
各フェーズの進捗は個別ファイル参照:
- [phase2-progress.md](phase2-progress.md) - コミュニケーション
- [phase3-progress.md](phase3-progress.md) - 課金 + 機能制限
- [phase4-progress.md](phase4-progress.md) - 付加価値
- [phase5-progress.md](phase5-progress.md) - 分析 + 高度機能
