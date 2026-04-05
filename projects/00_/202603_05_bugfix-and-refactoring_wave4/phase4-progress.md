# Phase 4 — DM/チャンネルUseCase化

> **最終更新**: 2026-03-22
> **ステータス**: ✅ Phase 4 完了

## フェーズ概要
- **ゴール**: wave3 Phase 4 でスコープ外としたDM/チャンネル関連のフラット実装をDDDレイヤー化する
- **対象**: W4-09
- **変更対象レイヤー**: Domain / Infrastructure / UseCase / API
- **規模**: S〜M（4エンドポイント。wave3 Phase 4 のチャットUseCase化パターンを踏襲）

## タスク一覧

| タスク                                     | 状態   | 備考                                                   |
| ------------------------------------------ | ------ | ------------------------------------------------------ |
| W4-09a DM系UseCase化（DM作成・一覧・退出） | ✅ 完了 | IDMChannelRepository + Impl + 3 UseCase + dmRoutes薄化 |
| W4-09b チャンネル一覧UseCase化             | ✅ 完了 | ListMyChannelsUseCase + channelRoutes薄化              |

---

## W4-09 DM/チャンネルUseCase化

- **分類**: リファクタ
- **優先度**: P2
- **変更対象**: バックエンド
- **変更レイヤー**: Domain / Infrastructure / UseCase / API
- **由来**: wave3 Phase 4 スコープ外
- **依存**: wave3 Phase 4（チャットUseCase化）完了後

### 現状
- `dmRoutes.ts` 内でPrisma直接操作のフラット実装（3エンドポイント）
- `channelRoutes.ts` 内でPrisma直接操作のフラット実装（1エンドポイント）
- wave3 Phase 4 でメッセージ系・リアクション系・チャンネル取得/作成はUseCase化済み

### 対象ファイル・エンドポイント

| 対象ファイル                                            | エンドポイント数 | 内容                           |
| ------------------------------------------------------- | ---------------- | ------------------------------ |
| `backend/src/api/front/dm/routes/dmRoutes.ts`           | 3件              | DM作成、DM一覧、DM退出         |
| `backend/src/api/front/channel/routes/channelRoutes.ts` | 1件              | 自分が参加する全チャンネル一覧 |

### 仕様

#### W4-09a DM系UseCase化

| UseCase                | 入力                 | 処理                                                         |
| ---------------------- | -------------------- | ------------------------------------------------------------ |
| CreateDMChannelUseCase | userId, targetUserId | 既存DM確認 → なければDMChannel+DMParticipant作成 → 返却      |
| ListDMChannelsUseCase  | userId               | ユーザーが参加するDMチャンネル一覧取得（最新メッセージ付き） |
| LeaveDMChannelUseCase  | userId, channelId    | DMParticipant削除（物理削除）                                |

#### W4-09b チャンネル一覧UseCase化

| UseCase               | 入力   | 処理                                                            |
| --------------------- | ------ | --------------------------------------------------------------- |
| ListMyChannelsUseCase | userId | DM + コミュニティチャンネルの統合一覧取得（最新メッセージ付き） |

**データ取得戦略（✅ 確定）**: 複数リポジトリを UseCase 内で集約
- `IDMChannelRepository.listByUserId()` + `IChatChannelRepository.listByUserId()` を UseCase で呼び、マージ・ソート
- 各リポジトリの責務分離を優先。2回のクエリで十分高速

#### リポジトリ新設（✅ 確定 2026-03-21）

- **`IDMChannelRepository` 新設**（`IDMParticipantRepository` ではなく）
  - DM は「1:1チャンネル作成 + 参加者管理 + 一覧取得」がセットの概念
  - チャンネルと参加者を一つのリポジトリで扱うことで凝集度を高める
  - メソッド: `createDMChannel`, `findByParticipants`, `listByUserId`, `removeParticipant` 等
  - `IChatChannelRepository` とは分離（DM固有の1:1制約等を閉じ込める）
- wave3 Phase 4 で作成済みの `IChatChannelRepository` は拡張しない

#### Controller分離
- `dmController.ts` — DM系3エンドポイントのControllerハンドラ
- `channelController.ts` — チャンネル一覧のControllerハンドラ（既存拡張）
- 既存の `dmRoutes.ts` / `channelRoutes.ts` をルーティングのみに薄化

### 実装ステップ

| Step | 内容                                              | 対象レイヤー   |
| ---- | ------------------------------------------------- | -------------- |
| 1    | IDMChannelRepository インターフェース定義         | Domain         |
| 2    | DMChannelRepositoryImpl（Prisma）                 | Infrastructure |
| 3    | DM系3 UseCase 作成                                | Application    |
| 4    | チャンネル一覧 UseCase 作成                       | Application    |
| 5    | dmController / channelController 新設・拡張       | API            |
| 6    | dmRoutes / channelRoutes をルーティングのみに薄化 | API            |
| 7    | _usecaseFactory にDM系ファクトリー追加            | Bootstrap      |

### 受入条件
- DM作成・一覧・退出が UseCase 層経由で動作すること
- チャンネル一覧が UseCase 層経由で動作すること
- `dmRoutes.ts` / `channelRoutes.ts` にビジネスロジック・Prisma直接操作が残っていないこと
- 既存のDM/チャンネル機能に回帰がないこと
- tsc --noEmit が通ること

### 関連ファイル

#### 新規作成
- `backend/src/domains/chat/domain/repository/IDMChannelRepository.ts`
- `backend/src/domains/chat/infrastructure/repository/DMChannelRepositoryImpl.ts`
- `backend/src/application/chat/usecase/CreateDMChannelUseCase.ts`
- `backend/src/application/chat/usecase/ListDMChannelsUseCase.ts`
- `backend/src/application/chat/usecase/LeaveDMChannelUseCase.ts`
- `backend/src/application/chat/usecase/ListMyChannelsUseCase.ts`
- `backend/src/api/front/dm/controllers/dmController.ts`

#### 変更
- `backend/src/api/front/dm/routes/dmRoutes.ts` — ルーティングのみに薄化
- `backend/src/api/front/channel/routes/channelRoutes.ts` — ルーティングのみに薄化
- `backend/src/api/_usecaseFactory.ts` — DM系ファクトリー追加

---

## 作業ログ
- 2026-03-20: Phase 4 作成。wave3 Phase 4 スコープ外のDM/チャンネルUseCase化を計画。wave3 Phase 4 のパターン（Domain → Infra → UseCase → Controller → Route薄化）を踏襲。
- 2026-03-21: 設計判断すり合わせ完了。リポジトリを `IDMParticipantRepository` → `IDMChannelRepository` に変更（DMチャンネル+参加者を一つのリポジトリで凝集）。ListMyChannelsUseCase は複数リポジトリを UseCase 内で集約する方式に確定。
- 2026-03-22: Phase 4 全タスク実装完了。
  - W4-09a: IDMChannelRepository + DMChannelRepositoryImpl（効率的な参加者セット検索）、CreateDMChannelUseCase（冪等DM作成+通知）、ListDMChannelsUseCase、LeaveDMChannelUseCase 作成。dmRoutes.ts をルーティングのみに薄化
  - W4-09b: ListMyChannelsUseCase（Community/Activity/DM 3セクション集約）作成。channelRoutes.ts をルーティングのみに薄化
  - _usecaseFactory.ts に DM系4ファクトリー追加（createCreateDMChannelUseCase, createListDMChannelsUseCase, createLeaveDMChannelUseCase, createListMyChannelsUseCase）
  - BE/FE ともに tsc --noEmit パス確認済み
