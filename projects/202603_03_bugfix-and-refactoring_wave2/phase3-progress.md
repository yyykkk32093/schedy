# Phase 3 — 中規模新機能（バックエンド変更あり）

## フェーズ概要
- **ゴール**: バックエンド変更を伴う中規模の新機能・機能改善を実装する（DB構造変更は最小限）
- **対象**: #1, #4, #18, #19, #20, #21, #33, #40, #49, #53
- **変更対象レイヤー**: UI / API / UseCase / Domain（一部DBマイグレーション）
- **推定規模**: L（10件。新機能中心で各件M規模）

> ⚠️ #4はAnnouncementテーブルへのactivityIdカラム追加（DBマイグレーション）が必要。設計判断はwave2-overview.mdを参照。

---

## #1 お知らせ: アクティビティ作成で絞り込み

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **依存**: #4（アクティビティ由来のお知らせを識別できる必要がある）
- **受入条件**:
  - お知らせ一覧でアクティビティ由来のお知らせをフィルターできること
  - お気に入りボタンの横にアクティビティフィルターボタンが配置されていること
  - ボタン押下でアクティビティ作成由来のお知らせのみ表示されること
  - 再押下でフィルター解除されること
- **実装方針（概要）**:
  - フロント: お知らせ一覧にフィルターボタンを追加。APIクエリパラメータにactivityFilter=trueを追加
  - バックエンド: お知らせ一覧APIにactivityId is not nullの条件フィルターを追加
- **関連ファイル（推定）**:
  - `frontend/src/features/home/components/FeedList.tsx`
  - `frontend/src/features/community/components/detail/tabs/AnnouncementTab.tsx`
  - `backend/src/api/front/announcement/`
  - `backend/src/application/announcement/`

---

## #4 お知らせ: アクティビティ作成時にお知らせ投稿選択 ⚠️ 設計判断が必要

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase / Domain / DB
- **依存**: なし（#1の前提となる）
- **受入条件**:
  - アクティビティ作成画面に「お知らせも投稿する」チェックボックスがあること
  - チェックONでアクティビティ作成と同時にお知らせが自動投稿されること
  - 投稿されたお知らせにアクティビティとの紐付けが保持されること（フィルター用）
- **実装方針（概要）**:
  - **DB変更**: `Announcement`テーブルに`activityId`（nullable、FK to Activity）を追加
  - **マイグレーション**: `ALTER TABLE Announcement ADD COLUMN activityId TEXT REFERENCES Activity(id)`
  - **バックエンド**: アクティビティ作成UseCaseにお知らせ同時作成ロジックを追加
  - **フロント**: ActivityFormにチェックボックスを追加
- **関連ファイル（推定）**:
  - `backend/prisma/schema.prisma`（AnnouncementモデルにactivityId追加）
  - `backend/src/application/activity/`
  - `backend/src/domains/announcement/domain/model/entity/Announcement.ts`
  - `frontend/src/features/activity/components/ActivityForm.tsx`

---

## #18 チャット: リアクションUI改善

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **依存**: なし
- **受入条件**:
  - メッセージホバー/長押し時にモーダルなしでよく使う絵文字5つが横に表示されること
  - 右端のボタンから追加の絵文字を選択できること（絵文字ピッカー表示）
  - 絵文字ピッカーはネイティブ絵文字の「顔・感情」「手・ジェスチャー」タブで構成されること
  - リアクションが正しくサーバーに保存され、他ユーザにも表示されること
- **実装方針（概要）**:
  - 現在のMessageReactionはStamp（カスタムスタンプ）ベースだが、ネイティブ絵文字リアクションにも対応が必要
  - 方式: MessageReactionテーブルのstampIdをnullable化し、新たに`emoji`カラム（String）を追加。stampIdがnullの場合はemoji文字列で表示
  - またはStampテーブルにネイティブ絵文字をプリセット登録
  - フロント: MessageBubbleの横にクイックリアクションバーを配置。5つのデフォルト絵文字（👍❤️😂😮🙏等）をボタンとして表示
  - 絵文字ピッカー: emoji-mart等のライブラリ、またはカスタム実装で顔/手カテゴリのみ表示
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageBubble.tsx`
  - `frontend/src/features/stamp/`（存在する場合）
  - `backend/src/api/front/chat/` または `backend/src/api/front/stamp/`
  - `backend/prisma/schema.prisma`（MessageReactionの拡張検討）

---

## #19 チャット: 削除済み表示

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / Domain
- **依存**: なし
- **受入条件**:
  - 削除されたメッセージは「このメッセージは削除されました」等のプレースホルダーテキストで表示されること
  - 誰がいつ削除したかは表示しないこと
  - 削除済みメッセージにはリアクション等のアクションが不可であること
- **実装方針（概要）**:
  - バックエンド: メッセージ削除を物理削除ではなくソフトデリート（`deletedAt`カラム追加、またはcontentを空にしてフラグ管理）に変更
  - Messageモデルに`deletedAt`が無い場合は追加。既にある場合は既存ロジック確認
  - フロント: MessageBubbleでdeletedAtがnullでない場合はプレースホルダーを表示
- **関連ファイル（推定）**:
  - `backend/prisma/schema.prisma`（Messageモデル）
  - `backend/src/api/front/chat/`
  - `frontend/src/features/chat/components/MessageBubble.tsx`

---

## #20 チャット: 削除確認ダイアログ

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: #19（削除機能が正しく動作すること）
- **受入条件**:
  - メッセージ削除操作時に「このメッセージを削除しますか？」の確認ダイアログが表示されること
  - 「削除」ボタン押下で削除実行、「キャンセル」で中断
- **実装方針（概要）**: shadcn/uiのAlertDialogを使用
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageBubble.tsx`
  - `frontend/src/features/chat/components/ChatView.tsx`

---

## #21 チャット: リアクション・削除アイコン配置

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: #18, #19（リアクション・削除機能）
- **受入条件**:
  - メッセージの真横にリアクションアイコンと削除アイコンが縦に2つ配置されること
  - 1行のメッセージの高さに収まるサイズであること
  - ホバー（またはタップ）時のみ表示されること
- **実装方針（概要）**:
  - MessageBubbleの隣にaction-iconsコンテナ（flex-col, gap-1）を配置
  - 上: リアクションアイコン（😊等）→ クリックでクイックリアクションバー表示
  - 下: 削除アイコン（🗑️等）→ クリックで#20の確認ダイアログ表示
  - 自分のメッセージのみ削除アイコン表示
  - アイコンサイズ: w-4 h-4程度
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageBubble.tsx`

---

## #33 アクティビティ詳細: チャット開始ボタン

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **依存**: なし
- **受入条件**:
  - アクティビティ詳細画面の幹事・参加費の右横に「チャットを始める」ボタン（2行分の高さ）が配置されること
  - ボタン押下でアクティビティ用チャットチャネルが作成され（未作成の場合）、チャット画面に遷移すること
  - チャット名は「コミュニティ名\nアクティビティ名：日付」形式で表示されること
  - 既にチャネルが存在する場合はそのチャネルに遷移すること
- **実装方針（概要）**:
  - バックエンド: ChatChannelの`type=ACTIVITY`, `activityId`でチャネルを検索。なければ作成するAPI（getOrCreate）
  - フロント: ActivityDetailPageに「チャットを始める」ボタンを追加。押下時にチャネル取得/作成APIを呼び、チャット画面に遷移
  - チャネル表示名の組み立てはフロント側で行う
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `frontend/src/features/chat/pages/ChannelPage.tsx`
  - `backend/src/api/front/channel/`
  - `backend/src/application/`（channel関連UseCase）

---

## #40 アクティビティ詳細: 現金支払い一括更新

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **依存**: なし
- **受入条件**:
  - 管理者以上（OWNER/ADMIN）に支払いヘッダーの「支払い」右横にアイコン（一括更新）が表示されること
  - アイコン押下で「現金支払いのステータスを更新しますか？」ダイアログが表示されること
  - ダイアログに現金支払い対象者のリストがチェックボックス付きで表示されること
  - デフォルトで全選択状態であること
  - 個別のチェックON/OFFが可能であること
  - 「更新」押下で選択された対象者の支払いステータスが一括更新されること
- **実装方針（概要）**:
  - バックエンド: 現金支払い一括更新API（POST）を新設。scheduleId + userId[]を受け取り、該当Paymentのstatusを更新
  - フロント: ActivityDetailPageに一括更新アイコン＋ダイアログを追加。対象者リストをPaymentデータからフィルタリング（paymentMethod=CASH）
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `backend/src/api/front/participation/` または `backend/src/api/front/schedule/`
  - `backend/src/application/participation/` または `backend/src/application/schedule/`
  - `backend/src/domains/payment/`

---

## #49 コミュニティ設定: 参加設定等の編集追加

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **依存**: #44（コミュニティ設定画面統合後に追加）
- **受入条件**:
  - コミュニティ設定画面で以下を編集できること:
    - 参加設定（公開/非公開、参加方式）
    - 活動情報（活動エリア、頻度、曜日等）
    - カテゴリ
    - タグ
  - 変更が正しくサーバーに保存されること
  - 保存後にコミュニティ詳細画面に反映されること
- **実装方針（概要）**:
  - フロント: CommunitySettingsPageに参加設定/活動情報/カテゴリ/タグのフォームセクションを追加
  - バックエンド: コミュニティ更新APIが参加設定・活動情報・カテゴリ・タグの更新をサポートしているか確認。不足があれば追加
  - Communityモデルには既にjoinMethod, isPublic, mainActivityArea, activityFrequency等のカラムがあるため、API接続のみで対応できる可能性
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`
  - `backend/src/api/front/community/`
  - `backend/src/application/community/`
  - `backend/src/domains/community/`

---

## #53 コミュニティ一覧: ブックマーク＋絞り込み

- **分類**: 新機能
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API / DB
- **依存**: なし
- **受入条件**:
  - 参加コミュニティ一覧の各コミュニティにブックマークボタンがあること
  - ブックマーク状態がサーバーに保存されること
  - ブックマーク済みコミュニティで絞り込み表示ができること
- **実装方針（概要）**:
  - **DB**: `CommunityBookmark`テーブル（communityId, userId, createdAt）を新設。@@unique([communityId, userId])
  - **バックエンド**: ブックマーク登録/解除API、コミュニティ一覧APIにブックマークフィルター追加
  - **フロント**: CommunityListPageにブックマークボタン＋フィルタートグルを追加
- **関連ファイル（推定）**:
  - `backend/prisma/schema.prisma`（CommunityBookmark新設）
  - `backend/src/api/front/community/`
  - `backend/src/application/community/`
  - `frontend/src/features/community/pages/CommunityListPage.tsx`
  - `frontend/src/features/community/components/CommunityCard.tsx`

---

## 作業手順（推奨順序）
1. **DB変更を先行**: #4（Announcement.activityId）→ #53（CommunityBookmark）→ #19（Message.deletedAt確認）
2. **チャット機能群**: #19 → #18 → #20 → #21
3. **お知らせ連携**: #4 → #1
4. **アクティビティ**: #33 → #40
5. **コミュニティ設定**: #49
6. **コミュニティ一覧**: #53
