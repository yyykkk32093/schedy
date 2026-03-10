# 📋 Phase 2 実装進捗トラッカー — コミュニケーション + Phase1フロントエンド

> **最終更新**: 2026-02-11
> **ベース**: [memo.md](memo.md) の Phase 2 計画
> **対象**: Phase1フロントエンド + ChatChannel + Message + DM + Announcement + Stamp + Notification
> **ステータス**: ✅ 全Batch完了（Batch 2-A + 2-B）

---

## 2-0. Phase 1 フロントエンド実装 ✅ 完了

> Phase 1 のバックエンドAPI（24エンドポイント）に対応するフロントエンド実装。
> 技術スタック: React + Vite + TypeScript + TanStack Query + Tailwind CSS

### 2-0-a. 共通基盤 ✅ 完了

| タスク                                                  | 状態   | 備考                                                |
| ------------------------------------------------------- | ------ | --------------------------------------------------- |
| API 型定義（Community/Activity/Schedule/Participation） | ✅ 完了 | `shared/types/api.ts` に全型定義追加                |
| API クライアント関数群                                  | ✅ 完了 | `features/*/api/` に各 API 関数を作成               |
| TanStack Query キー定義                                 | ✅ 完了 | `shared/lib/queryKeys.ts` に全ドメインキー追加      |
| ルーティング定義追加                                    | ✅ 完了 | `app/App.tsx` に全8ルート追加（ProtectedRoute使用） |

### 2-0-b. Community 画面 ✅ 完了

| タスク                   | 状態   | 備考                                  |
| ------------------------ | ------ | ------------------------------------- |
| コミュニティ一覧ページ   | ✅ 完了 | CommunityListPage.tsx                 |
| コミュニティ作成フォーム | ✅ 完了 | CommunityListPage内インラインフォーム |
| コミュニティ詳細ページ   | ✅ 完了 | CommunityDetailPage.tsx               |
| コミュニティ編集         | ✅ 完了 | CommunityDetailPage内インライン編集   |
| コミュニティ削除         | ✅ 完了 | CommunityListPage内削除ボタン         |
| サブコミュニティ作成     | ✅ 完了 | CommunityDetailPage内作成ボタン       |

### 2-0-c. Membership 画面 ✅ 完了

| タスク                  | 状態   | 備考                          |
| ----------------------- | ------ | ----------------------------- |
| メンバー一覧            | ✅ 完了 | CommunityDetailPage内に表示   |
| メンバー追加            | ✅ 完了 | CommunityDetailPage内フォーム |
| ロール変更 / OWNER 委譲 | ✅ 完了 | hooks実装済み（UI組込は今後） |
| コミュニティ脱退        | ✅ 完了 | hooks実装済み                 |

### 2-0-d. Activity 画面 ✅ 完了

| タスク                            | 状態   | 備考                                 |
| --------------------------------- | ------ | ------------------------------------ |
| Activity 一覧（コミュニティ配下） | ✅ 完了 | ActivityListPage.tsx                 |
| Activity 作成フォーム             | ✅ 完了 | ActivityListPage内インラインフォーム |
| Activity 詳細ページ               | ✅ 完了 | ActivityDetailPage.tsx               |
| Activity 編集                     | ✅ 完了 | ActivityDetailPage内インライン編集   |
| Activity 削除（論理）             | ✅ 完了 | ActivityListPage内削除ボタン         |

### 2-0-e. Schedule 画面 ✅ 完了

| タスク                         | 状態   | 備考                                 |
| ------------------------------ | ------ | ------------------------------------ |
| Schedule 一覧（Activity 配下） | ✅ 完了 | ScheduleListPage.tsx                 |
| Schedule 作成フォーム          | ✅ 完了 | ScheduleListPage内インラインフォーム |
| Schedule 詳細ページ            | ✅ 完了 | ScheduleDetailPage.tsx               |
| Schedule 編集                  | ✅ 完了 | ScheduleDetailPage内インライン編集   |
| Schedule キャンセル            | ✅ 完了 | ScheduleDetailPage内キャンセルボタン |

### 2-0-f. Participation / Waitlist 画面 ✅ 完了

| タスク             | 状態   | 備考                                          |
| ------------------ | ------ | --------------------------------------------- |
| 参加表明ボタン     | ✅ 完了 | ScheduleDetailPage内「参加する」ボタン        |
| 参加キャンセル     | ✅ 完了 | ScheduleDetailPage内「参加取消」ボタン        |
| キャンセル待ち登録 | ✅ 完了 | ScheduleDetailPage内「キャンセル待ち」ボタン  |
| キャンセル待ち辞退 | ✅ 完了 | ScheduleDetailPage内「WL取消」ボタン          |
| 参加者一覧表示     | 🔶 保留 | API未実装（参加者一覧取得エンドポイントなし） |

---

## 2-1. ChatChannel + Message 基盤 ✅ 完了

| タスク                                                  | 状態   | 備考                                               |
| ------------------------------------------------------- | ------ | -------------------------------------------------- |
| WebSocket 導入（Socket.io）                             | ✅ 完了 | Express に並列追加（http.createServer + SocketIO） |
| ChatChannel エンティティ（type: COMMUNITY/ACTIVITY/DM） | ✅ 完了 | Prisma + REST API                                  |
| Message エンティティ                                    | ✅ 完了 | content, senderId, channelId, parentMessageId      |
| メッセージ永続化                                        | ✅ 完了 | Prisma スキーマ + CRUD API                         |
| コミュニティチャット（Community 作成時に自動生成）      | ✅ 完了 | chatRoutes.ts 内で自動生成                         |
| Prisma スキーマ（ChatChannel, Message テーブル）        | ✅ 完了 | + MessageAttachment テーブル                       |
| リアルタイムメッセージ送受信 API                        | ✅ 完了 | WebSocket + REST 両対応                            |

---

## 2-2. スレッド ✅ 完了

| タスク                                            | 状態   | 備考                                      |
| ------------------------------------------------- | ------ | ----------------------------------------- |
| parentMessageId（null = トップレベル、1階層のみ） | ✅ 完了 | Message.parentMessageId + リレーション    |
| スレッドメッセージ一覧取得 API                    | ✅ 完了 | GET /v1/channels/:id/messages/:id/replies |

---

## 2-3. メンション ✅ 完了

| タスク                     | 状態   | 備考                                       |
| -------------------------- | ------ | ------------------------------------------ |
| @ユーザー名 → 通知トリガー | ✅ 完了 | Message.mentions（JSON配列）フィールド実装 |
| メンション通知連携         | ✅ 完了 | Notification テーブル連携                  |

---

## 2-4. DM ✅ 完了

| タスク                               | 状態   | 備考                                     |
| ------------------------------------ | ------ | ---------------------------------------- |
| ChatChannel(type=DM) + DMParticipant | ✅ 完了 | DMParticipant テーブル + 複数人招待対応  |
| DM 作成 API                          | ✅ 完了 | plan チェック付き（FREE は新規開始不可） |
| DM 受信・返信                        | ✅ 完了 | FREE でも受信・返信可能                  |

---

## 2-5. Announcement + 既読管理 ✅ 完了

| タスク                      | 状態   | 備考                                          |
| --------------------------- | ------ | --------------------------------------------- |
| Announcement エンティティ   | ✅ 完了 | DDD 4層 + AggregateRoot, OWNER/ADMIN のみ作成 |
| AnnouncementRead 既読管理   | ✅ 完了 | 冪等な markAsRead（upsert）                   |
| Announcement CRUD API       | ✅ 完了 | 5エンドポイント実装 + E2Eテスト9件合格        |
| 既読状態取得 API            | ✅ 完了 | 一覧取得時に isRead フラグ付与                |
| Announcement フロントエンド | ✅ 完了 | AnnouncementListPage + DetailPage             |

---

## 2-6. Stamp + MessageReaction ✅ 完了

> memo.md では Phase 4 計画だが、チャット基盤と同時に Batch 2-B で前倒し実装。

| タスク              | 状態   | 備考                                              |
| ------------------- | ------ | ------------------------------------------------- |
| Stamp CRUD API      | ✅ 完了 | POST/GET/DELETE + plan チェック（上限100）        |
| MessageReaction API | ✅ 完了 | PUT/DELETE + @@unique([messageId,userId,stampId]) |
| Prisma スキーマ     | ✅ 完了 | Stamp + MessageReaction テーブル                  |

---

## 2-7. Notification ✅ 完了

| タスク                | 状態   | 備考                                             |
| --------------------- | ------ | ------------------------------------------------ |
| Notification テーブル | ✅ 完了 | type/title/body/referenceId/referenceType/isRead |
| 通知一覧 API          | ✅ 完了 | GET /v1/notifications（userId でフィルタ）       |
| 既読マーク API        | ✅ 完了 | PATCH /v1/notifications/:id/read                 |

---

## 2-8. ファイルアップロード ✅ 完了

> memo.md では Phase 4 計画だが、チャット添付と同時に Batch 2-B で前倒し実装。

| タスク                               | 状態   | 備考                           |
| ------------------------------------ | ------ | ------------------------------ |
| IFileStorageService インターフェース | ✅ 完了 | Strategy パターン              |
| LocalFileStorageService              | ✅ 完了 | ローカル /uploads ディレクトリ |
| MessageAttachment API                | ✅ 完了 | multer + メッセージ添付        |
| 汎用アップロード API                 | ✅ 完了 | POST /v1/upload                |

---

## ビルド・テスト結果

| 項目                 | 結果                                    |
| -------------------- | --------------------------------------- |
| E2E テスト           | ✅ **85 tests / 12 files 全パス**        |
| バックエンドビルド   | ✅ `pnpm build` クリーン                 |
| フロントエンドビルド | ✅ `tsc --noEmit && pnpm build` クリーン |

---

## 技術的リスク

| リスク                                    | 対策案                                      |
| ----------------------------------------- | ------------------------------------------- |
| WebSocket 導入で Express 構成に大きな変更 | ✅ Socket.io を Express に並列追加で解決済み |
| リアルタイム配信のスケーラビリティ        | Redis Pub/Sub でスケールアウト（将来対応）  |

---

## 前提条件

- Phase 1 完了済み ✅
- Community, Activity, Schedule のCRUDが機能している前提
