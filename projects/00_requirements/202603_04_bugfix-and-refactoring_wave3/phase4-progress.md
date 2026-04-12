# Phase 4 — チャットスレッド機能 + チャットUseCase化リファクタ

> **最終更新**: 2026-03-20
> **ステータス**: ✅ Phase 4 完了

## フェーズ概要
- **ゴール**: チャットにスレッド（返信）機能を実装する + 既存チャット全体をDDDレイヤー化
- **対象**: W3-15
- **変更対象レイヤー**: Domain / Infrastructure / UseCase / API / WS / UI
- **規模**: XL（DB準備済み。既存チャット全体のUseCase化 + スレッドUI大規模新規実装）

## タスク一覧

| タスク                                                                              | 状態   | 備考                                         |
| ----------------------------------------------------------------------------------- | ------ | -------------------------------------------- |
| W3-15a チャット全体: DDD レイヤー化（ドメイン + リポジトリ + UseCase + Controller） | ✅ 完了 | 既存7エンドポイント + WS7イベントをUseCase化 |
| W3-15b チャット: スレッド機能（parentMessageId活用 + UI）                           | ✅ 完了 | スレッドビュー新設 + リアルタイム対応        |

---

## 設計判断

| #   | 判断                        | 確定案                                                                       |
| --- | --------------------------- | ---------------------------------------------------------------------------- |
| D-1 | スレッドビュー表示形式      | **B: オーバーレイモーダル**（モバイルメイン）                                |
| D-2 | ネスト制限                  | **B: バリデーション拒否** + フロントでルートID固定                           |
| D-3 | 最新返信プレビュー          | **A: メッセージ一覧APIに含める**（Prisma include, バッチINクエリ）           |
| D-4 | WSキャッシュ更新            | **B: `thread:new` 別イベント新設**（関心の分離）                             |
| D-5 | スレッド状態管理            | **B: URL searchParams**（`?thread=messageId`。ブラウザバック対応）           |
| D-6 | replyCount リアルタイム更新 | **B: `thread:new` に `replyCount` 含めて配信**（D-4と一貫）                  |
| D-7 | DDDレイヤー化               | **B: 既存チャット全体をUseCase化**（スレッド関連だけでなく全エンドポイント） |

### D-2 補足: ネスト制限の具体実装
- **バックエンド**: `parentMessageId` の指すメッセージが既に `parentMessageId` を持つ場合 → 400 エラー返却
- **フロント**: スレッドビュー内の送信では常にルートメッセージIDを `parentMessageId` に固定

### D-4/D-6 補足: WSイベント設計
- `message:new`: メインビュー用。`senderDisplayName` / `senderAvatarUrl` / `replyCount` を追加
- `thread:new`: スレッドビュー用。返信メッセージ本体 + 送信者情報 + 親メッセージの最新 `replyCount`

### D-7 補足: UseCase化スコープ
- **今回スコープ**: メッセージ系（送信/一覧/検索/スレッド/削除） + リアクション系（追加/削除） + チャンネル取得/作成
- **wave4送り**: DM CRUD（dmRoutes.ts）、チャンネル一覧（channelRoutes.ts）

---

## W3-15 チャット: スレッド機能

- **分類**: 新機能 + リファクタ
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: Domain / Infrastructure / UseCase / API / WS / UI
- **由来**: wave2繰越 #25
- **依存**: wave2 Phase3 のチャット機能改善（#18〜#21: リアクション・削除済み表示等）が完了していること

### 前提
- DB: `Message.parentMessageId`（自己参照FK）+ `@@index([parentMessageId])` は wave2 で追加済み。追加のDB変更は不要
- wave2 で実装済みの機能: 絵文字リアクション、論理削除、削除確認ダイアログ、送信者名表示
- 既存チャットはchatRoutes.ts内でPrisma直接操作のフラット実装（アンチパターン）→ 本Phase で正規化

### 仕様

#### メッセージ一覧（メインビュー）
| 項目                 | 内容                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| スレッドカウント表示 | メッセージバブルの下部に「💬 N件の返信」リンクを表示（parentMessageId = このメッセージID の件数） |
| 最新返信プレビュー   | スレッドカウントの横に最新返信の送信者名 + 本文（1行トランケート）を表示                         |
| スレッドへの遷移     | 「N件の返信」リンクをタップでスレッドビューを開く                                                |

#### スレッドビュー
| 項目         | 内容                                                        |
| ------------ | ----------------------------------------------------------- |
| 表示形式     | オーバーレイモーダル（モバイル: フルスクリーン）            |
| ヘッダー     | 親メッセージの送信者名 + 本文プレビュー + 閉じるボタン      |
| 本文         | 親メッセージ（先頭固定表示） + 返信一覧（時系列昇順）       |
| 入力欄       | 通常のメッセージ入力と同様（テキスト + 画像添付）           |
| リアクション | 返信メッセージにもリアクション可能                          |
| ネスト制限   | **1階層のみ**（返信への返信はフラットに同一スレッド内表示） |
| 状態管理     | URL searchParams `?thread=messageId`（ブラウザバック対応）  |

#### バックエンドAPI
| エンドポイント                                     | 動作                                                |
| -------------------------------------------------- | --------------------------------------------------- |
| `POST /v1/channels/:channelId/messages`            | parentMessageId 指定で返信作成（D-2バリデーション） |
| `GET /v1/messages/:messageId/replies`              | スレッド返信一覧取得（ページネーション対応）        |
| `GET /v1/channels/:channelId/messages`（既存拡張） | レスポンスに `replyCount` + `latestReply` 追加      |

#### WebSocket イベント
| イベント           | 方向          | ペイロード                                                      |
| ------------------ | ------------- | --------------------------------------------------------------- |
| `message:new`      | Server→Client | トップレベルメッセージ + senderDisplayName/AvatarUrl/replyCount |
| `thread:new`       | Server→Client | 返信メッセージ本体 + 送信者情報 + 親のreplyCount                |
| `message:deleted`  | Server→Client | 既存通り                                                        |
| `reaction:updated` | Server→Client | 既存通り                                                        |

### 受入条件
- メッセージに対してスレッド（返信）を作成できること
- メッセージバブル下部に「N件の返信」+ 最新返信プレビューが表示されること
- タップでスレッドビュー（モーダル）が開き、返信一覧が表示されること
- スレッドビュー内で返信の送受信ができること
- 返信への返信は400エラーになること（ネスト不可）
- `thread:new` WSイベントでスレッドの返信件数がリアルタイム更新されること
- ブラウザバックでスレッドビューが閉じること
- 既存チャット全体がUseCase層経由で動作すること（フラット実装の解消）

### 実装ステップ

| Step | 内容                                                  | 対象レイヤー   |
| ---- | ----------------------------------------------------- | -------------- |
| 0    | ドメイン層新設（Entity, ValueObject, Repository I/F） | Domain         |
| 1    | リポジトリ実装（Prisma）                              | Infrastructure |
| 2    | UseCase化（既存7EP + リアクション2 + スレッド）       | Application    |
| 3    | Controller + Route分離 + WS UseCase委譲               | API / WS       |
| 4    | フロントエンド ThreadView + MessageBubble拡張         | UI             |
| 5    | フロントエンド リアルタイム対応                       | UI (hooks)     |
| 6    | UseCase単体テスト                                     | Test           |

### 関連ファイル

#### 新規作成（バックエンド）
- `backend/src/domains/chat/domain/model/entity/Message.ts`
- `backend/src/domains/chat/domain/model/valueObject/MessageId.ts`
- `backend/src/domains/chat/domain/model/valueObject/MessageContent.ts`
- `backend/src/domains/chat/domain/model/valueObject/ChannelId.ts`
- `backend/src/domains/chat/domain/repository/IMessageRepository.ts`
- `backend/src/domains/chat/domain/repository/IChatChannelRepository.ts`
- `backend/src/domains/chat/domain/repository/IMessageReactionRepository.ts`
- `backend/src/domains/chat/infrastructure/repository/MessageRepositoryImpl.ts`
- `backend/src/domains/chat/infrastructure/repository/ChatChannelRepositoryImpl.ts`
- `backend/src/domains/chat/infrastructure/repository/MessageReactionRepositoryImpl.ts`
- `backend/src/application/chat/usecase/` — 全UseCase
- `backend/src/api/front/chat/controllers/chatController.ts`

#### 変更（バックエンド）
- `backend/src/api/front/chat/routes/chatRoutes.ts` — ルーティングのみに薄化
- `backend/src/api/ws/socketHandlers.ts` — UseCase委譲 + thread:new イベント追加
- `backend/src/api/_usecaseFactory.ts` — チャット系ファクトリー追加

#### 新規作成（フロントエンド）
- `frontend/src/features/chat/components/ThreadView.tsx`

#### 変更（フロントエンド）
- `frontend/src/features/chat/components/ChatView.tsx` — searchParams + ThreadView統合
- `frontend/src/features/chat/components/MessageBubble.tsx` — onOpenThread + latestReply表示
- `frontend/src/features/chat/components/MessageInput.tsx` — parentMessageId prop
- `frontend/src/features/chat/hooks/useSocketChat.ts` — thread:new + message:new振り分け
- `frontend/src/features/chat/hooks/useChatQueries.ts` — useSendMessage parentMessageId対応
- `frontend/src/shared/types/api.ts` — MessageItem.latestReply追加

---

## 作業ログ
- 2026-03-16: Phase 4 作成。チャットスレッド機能を計画。
- 2026-03-19: 設計判断 D-1〜D-7 確定。既存チャット全体のUseCase化をスコープに追加。DM/Channel一覧のUseCase化はwave4送り。
- 2026-03-19: Step 0〜2 完了（Domain / Repository / UseCase 層の全ファイル作成）。
- 2026-03-20: Step 2〜5 完了。usecaseFactory にchat系ファクトリ追加、chatController新設、chatRoutes薄化、socketHandlers UseCase委譲化 + thread:new イベント追加。フロントエンド: MessageItem.latestReply型追加、ThreadView.tsx新設、ChatView/MessageBubble にスレッドUI統合、useSocketChat に thread:new / message:new 振り分け実装。Backend/Frontend ともに tsc --noEmit 通過。
