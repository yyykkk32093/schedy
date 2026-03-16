# Phase 2 — UI/UX改善（フロント中心）

> **最終更新**: 2026-03-15
> **ステータス**: ✅ Phase 2 完了（28/28）

## タスクステータス一覧

| #   | タスク                           | グループ | 状態   | 備考                                                        |
| --- | -------------------------------- | -------- | ------ | ----------------------------------------------------------- |
| 2   | お知らせ: プロフィール画像拡大   | A        | ✅ 完了 | ImagePreviewModal共通化済み                                 |
| 3   | お知らせ: 経過時間表示改善       | A        | ✅ 完了 | formatRelativeTime + Tooltip                                |
| 6   | お知らせ: 詳細画面遷移改善       | A        | ✅ 完了 | FeedCard本文・コメントボタン→詳細遷移                       |
| 7   | お知らせ: 詳細画面開封時既読     | A        | ✅ 完了 | FE: useEffect+markAsRead / BE: upsertで冪等                 |
| 8   | お知らせ: 一覧文字数制限         | A        | ✅ 完了 | line-clamp-4 適用                                           |
| 9   | お知らせ: 既読数表示             | A        | ✅ 完了 | BE: countByAnnouncementIds追加 / FE: readCount表示          |
| 10  | コミュニティ詳細: 集金管理       | B        | ✅ 完了 | ラベル差替え                                                |
| 11  | コミュニティ詳細: 返金一覧       | B        | ✅ 完了 | ラベル差替え                                                |
| 14  | コミュニティ詳細: 画像拡大       | B        | ✅ 完了 | カバー/ロゴ→ImagePreviewGallery                             |
| 15  | コミュニティ詳細: 招待ボタン     | B        | ✅ 完了 | CommunityProfileHeaderに追加                                |
| 22  | チャット: 行数制限               | C        | ✅ 完了 | line-clamp-[60] + 「全て表示」リンク                        |
| 23  | チャット: 送信者名表示           | C        | ✅ 完了 | BE: Message→User JOIN追加 / FE: senderName+アバター画像対応 |
| 24  | チャット: 添付画像プレビュー     | C        | ✅ 完了 | ImagePreviewGalleryでサムネイル表示                         |
| 26  | チャット: マイクアイコン削除     | C        | ✅ 完了 | MessageInputから削除済み                                    |
| 27  | チャット: 絵文字アイコン削除     | C        | ✅ 完了 | MessageInputから削除済み                                    |
| 28  | チャット: 送受信時間表示         | C        | ✅ 完了 | formatTime(hh:mm)表示                                       |
| 30  | アルバム: 右上ボタン廃止         | F        | ✅ 完了 | FABのみに統一                                               |
| 34  | アクティビティ: 過去ボタン非活性 | D        | ✅ 完了 | isExpired判定で「この予定は終了しました」表示               |
| 35  | アクティビティ: 後で支払う       | D        | ✅ 完了 | モーダルに「後で支払う」追加                                |
| 43  | 設定: 招待リンク動線廃止         | E        | ✅ 完了 | セクション削除済み                                          |
| 44  | 設定: プロフィール+支払い統合    | E        | ✅ 完了 | handleSaveAllで一括保存                                     |
| 45  | 設定: 監査ログ→変更履歴          | E        | ✅ 完了 | ラベル差替え                                                |
| 47  | 設定: 未保存時注意喚起           | E        | ✅ 完了 | useUnsavedChangesWarning + UnsavedChangesDialog             |
| 48  | 設定: 外部連携蓋閉じ             | E        | ✅ 完了 | 「準備中です」表示                                          |
| 52  | コミュニティ一覧: FAB化          | F        | ✅ 完了 | split FAB（検索+作成）                                      |
| 55  | 通知: ステータス日本語化         | F        | ✅ 完了 | 全17タイプのマッピング                                      |
| 57  | マイページ: 未保存アラート       | F        | ✅ 完了 | useUnsavedChangesWarning                                    |
| 58  | マイページ: 保存フィードバック   | F        | ✅ 完了 | toast.success('保存しました')                               |

### 完了報告

全28タスク完了。主要な追加対応:
- **#23 BE**: PrismaスキーマにMessage→Userの`sender`リレーション追加。メッセージ一覧/検索/スレッド返信APIでUser JOINし`senderDisplayName`/`senderAvatarUrl`を返却
- **#23 FE**: `MessageItem`型にフィールド追加。`ChatView`から`MessageBubble`に`senderName`/`senderAvatarUrl`を渡すよう修正。アバターに`AvatarImage`追加
- **#9 BE**: `IAnnouncementReadRepository`に`countByAnnouncementIds`追加。Feed/List/Search/Find全UseCaseに`readCount`追加
- **#47/#57 FEバグ修正**: `useUnsavedChangesWarning`を早期return前に移動（Hooksルール違反修正）
- **#52 FEバグ修正**: FABのプロップ修正 + デザイン調整（白背景+区切り線+陰影強化）

---

## フェーズ概要
- **ゴール**: フロントのみ（または軽微なバックエンド変更）で完結するUI/UX改善を一括実施
- **対象**: #2, #3, #6, #7, #8, #9, #10, #11, #14, #15, #22, #23, #24, #26, #27, #28, #30, #34, #35, #43, #44, #45, #47, #48, #52, #55, #57, #58
- **変更対象レイヤー**: UI中心。一部API（#7, #9）
- **推定規模**: L（28件だが個別はS〜M）

> 本フェーズは画面単位で並行作業が可能。以下のサブグループに分けて進めることを推奨。

---

## サブグループA: お知らせ関連（#2, #3, #6, #7, #8, #9）

### #2 お知らせ: プロフィール画像クリックで拡大表示

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - お知らせ一覧・詳細でユーザのプロフィール画像をクリックすると、画像がモーダル（またはオーバーレイ）で拡大表示されること
  - LINEのような全画面 or セミモーダル表示であること
  - モーダル外タップまたは閉じるボタンで閉じられること
- **実装方針（概要）**:
  - 共通の`ImagePreviewModal`コンポーネントを`shared/components/`に作成（#14と共通利用）
  - アバター画像のonClickイベントでモーダルを表示
- **関連ファイル（推定）**:
  - `frontend/src/shared/components/ui/`（新規: ImagePreviewModal）
  - `frontend/src/features/home/components/FeedCard.tsx`
  - `frontend/src/features/announcement/pages/AnnouncementDetailPage.tsx`

### #3 お知らせ: 経過時間の表示ロジック改善

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 0〜60分: `○分前`（例: `5分前`）
  - 60分〜24時間: `○時間前`（例: `3時間前`）
  - 24時間以降: `yyyy/mm/dd`形式の日付表示
  - ホバー（カーソルを当てる）時にツールチップで`yyyy/mm/dd/hh:mm`形式の日時を表示
- **実装方針（概要）**:
  - `frontend/src/shared/utils/`に`formatRelativeTime`ユーティリティ関数を作成（または既存の`dateGroup.ts`を拡張）
  - お知らせ投稿・コメントの日時表示箇所で利用
  - ツールチップはshadcn/uiのTooltipコンポーネントを利用
- **関連ファイル（推定）**:
  - `frontend/src/shared/utils/dateGroup.ts`（または新規ファイル）
  - `frontend/src/features/home/components/FeedCard.tsx`
  - `frontend/src/features/home/components/CommentSection.tsx`
  - `frontend/src/features/announcement/pages/AnnouncementListPage.tsx`

### #6 お知らせ: 詳細画面への遷移改善

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - お知らせ一覧で、題名・本文（画像含む）をクリックするとお知らせ詳細画面に遷移すること
  - コメントボタン押下でも同じ詳細画面に遷移すること（従来のインライン展開ではなく画面遷移）
- **実装方針（概要）**:
  - FeedCard/AnnouncementListの各アイテムにonClick遷移ハンドラを追加
  - コメントボタンのハンドラを詳細画面への遷移に変更
  - 遷移先: `/communities/:communityId/announcements/:announcementId`
- **関連ファイル（推定）**:
  - `frontend/src/features/home/components/FeedCard.tsx`
  - `frontend/src/features/community/components/detail/tabs/AnnouncementTab.tsx`
  - `frontend/src/features/announcement/pages/AnnouncementDetailPage.tsx`

### #7 お知らせ: 詳細画面開封時に既読付与

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **依存**: #6（詳細画面への遷移が先に必要）
- **受入条件**:
  - お知らせ詳細画面を開いた時点で、自動的に既読（AnnouncementRead）が作成されること
  - `...`メニューの「既読にする」ボタンは削除すること
  - 既に既読の場合は重複リクエストしないこと
- **実装方針（概要）**:
  - フロント: AnnouncementDetailPageのuseEffect内で既読APIを呼び出し
  - バックエンド: 既読APIが冪等（既に既読ならスキップ）であることを確認
  - `...`メニューから「既読にする」項目を削除
- **関連ファイル（推定）**:
  - `frontend/src/features/announcement/pages/AnnouncementDetailPage.tsx`
  - `frontend/src/features/announcement/api/`
  - `backend/src/api/front/announcement/`

### #8 お知らせ: 一覧の文字数制限（25文字×4行）

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - お知らせ一覧の各アイテムで本文が25文字×4行（100文字相当）を超える場合、超過部分が`...`で切り捨てられること
  - CSS line-clampで実装し、コンテンツ自体は保持すること
- **実装方針（概要）**:
  - CSSの`-webkit-line-clamp: 4`と`max-width`制御で実装
  - `FeedCard`コンポーネントの本文表示部分にスタイル適用
- **関連ファイル（推定）**:
  - `frontend/src/features/home/components/FeedCard.tsx`
  - `frontend/src/features/community/components/detail/tabs/AnnouncementTab.tsx`

### #9 お知らせ: 既読数表示

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **依存**: なし
- **受入条件**:
  - お知らせ一覧の各アイテムに既読数が表示されること（例: `既読 12`）
  - お知らせ詳細画面にも既読数が表示されること
  - 既読数はリアルタイム更新不要（画面遷移/リロード時に更新されればOK）
- **実装方針（概要）**:
  - バックエンド: お知らせ一覧/詳細APIのレスポンスに`readCount`フィールドを追加（AnnouncementReadのCOUNT）
  - フロント: 既読数をアイコン+数値で表示
- **関連ファイル（推定）**:
  - `backend/src/api/front/announcement/`
  - `backend/src/application/announcement/`
  - `frontend/src/features/home/components/FeedCard.tsx`
  - `frontend/src/features/announcement/pages/AnnouncementDetailPage.tsx`

---

## サブグループB: コミュニティ詳細関連（#10, #11, #14, #15）

### #10 コミュニティ詳細: 決済管理→集金管理

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - コミュニティ詳細画面の「決済管理」ボタンのラベルが「集金管理」に変更されていること
- **実装方針（概要）**: ボタンテキストの文字列を差し替え
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunityDetailPage.tsx`

### #11 コミュニティ詳細: 返金管理→返金一覧

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 「返金管理」ボタンのラベルが「返金一覧」に変更されていること
- **実装方針（概要）**: ボタンテキストの文字列を差し替え
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunityDetailPage.tsx`

### #14 コミュニティ詳細: プロフィール画像クリックで拡大表示

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: #2（ImagePreviewModalの共通コンポーネントを先に作成）
- **受入条件**:
  - コミュニティのプロフィール画像をクリックするとモーダルで拡大表示されること
- **実装方針（概要）**: #2で作成したImagePreviewModalを再利用
- **関連ファイル（推定）**:
  - `frontend/src/features/community/components/CommunityProfileHeader.tsx`

### #15 コミュニティ詳細: 招待ボタン追加

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 公開/非公開マークの右隣に招待ボタンが表示されること
  - ボタン押下で招待リンクの生成/コピー機能が動作すること
  - 設定画面からの招待動線は#43で廃止されるため、ここが唯一の動線となること
- **実装方針（概要）**:
  - CommunityProfileHeaderに招待ボタンを追加
  - 既存のInviteTokenのAPI呼び出しロジックを設定画面から移植
- **関連ファイル（推定）**:
  - `frontend/src/features/community/components/CommunityProfileHeader.tsx`
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`（ロジック移植元）

---

## サブグループC: チャット関連（#22, #23, #24, #26, #27, #28）

### #22 チャット: メッセージ文字数・行数制限

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - メッセージ表示が最大1行25文字×60行で制限されること
  - 80行を超えるメッセージには「全て表示」リンクが表示されること
  - 「全て表示」クリックで全文表示画面に遷移すること
- **実装方針（概要）**:
  - MessageBubbleコンポーネントにline-clamp（60行）を適用
  - 80行超の場合は全文表示ページへのリンクを追加
  - 全文表示画面は新規ページまたはモーダル
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageBubble.tsx`

### #23 チャット: 送信者名表示

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 自分以外のメッセージにおいて、プロフィール画像の右横上部に送信者名が表示されること
  - 送信者名のフォントサイズはプロフィール画像の約10%の大きさであること
- **実装方針（概要）**:
  - MessageBubbleコンポーネントで`senderId !== currentUserId`の場合にdisplayNameを表示
  - 小さいフォントサイズ（例: `text-[10px]`）でプロフィール画像の右上に配置
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageBubble.tsx`

### #24 チャット: 添付画像プレビュー

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 添付画像がファイル名テキストではなく、画像のサムネイルプレビューとして表示されること
  - プレビュー画像クリックで拡大表示できること
- **実装方針（概要）**:
  - MessageBubble内の添付ファイル表示ロジックを修正
  - mimeTypeが画像系（image/*）の場合は`<img>`タグでプレビュー表示
  - クリック時はImagePreviewModal（#2で作成）を利用
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageBubble.tsx`

### #26 チャット: マイクアイコン削除

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - メッセージ入力欄からマイクアイコンが削除されていること
- **実装方針（概要）**: MessageInputコンポーネントからマイクアイコン要素を削除
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageInput.tsx`

### #27 チャット: 絵文字アイコン削除

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - メッセージ入力欄から絵文字アイコンが削除されていること
- **実装方針（概要）**: MessageInputコンポーネントから絵文字アイコン要素を削除
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageInput.tsx`

### #28 チャット: 送受信時間表示

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 各メッセージの下に24時間形式（hh:mm）で送信/受信時間が表示されること
  - 表示色は薄いグレー（例: `text-gray-400`）
  - 表示サイズは1行メッセージの領域高さの約5%
- **実装方針（概要）**:
  - MessageBubbleコンポーネントにcreatedAt/sentAtのフォーマット表示を追加
  - `text-xs text-gray-400`程度のスタイリング
- **関連ファイル（推定）**:
  - `frontend/src/features/chat/components/MessageBubble.tsx`

---

## サブグループD: アクティビティ詳細関連（#34, #35）

### #34 アクティビティ詳細: 過去アクティビティのボタン非活性

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 開催時刻の終了時間を過ぎたアクティビティのスケジュールでは、全てのアクションボタン（参加/キャンセル/支払い等）がdisabled状態であること
  - ボタンの見た目がグレーアウトされ、操作不可であることが視覚的にわかること
- **実装方針（概要）**:
  - Schedule.endTimeと現在時刻を比較し、過去の場合は全ボタンにdisabled属性を付与
  - ActivityDetailPage内のスケジュール表示部分にisExpired判定を追加
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `frontend/src/features/activity/components/ScheduleCard.tsx`

### #35 アクティビティ詳細: PayPay「後で支払う」

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - PayPayの支払いモーダルに「後で支払う」ボタンが追加されていること
  - 「後で支払う」押下でモーダルが閉じ、支払いステータスが変更されないこと
- **実装方針（概要）**:
  - PayPay支払いモーダルに「後で支払う」ボタンを追加
  - ボタン押下時はモーダルを閉じるのみ（APIコール不要）
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`（PayPayモーダル部分）

---

## サブグループE: コミュニティ設定関連（#43, #44, #45, #47, #48）

### #43 コミュニティ設定: 招待リンク動線廃止

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: #15（コミュニティ詳細に招待ボタンが追加された後に廃止）
- **受入条件**:
  - コミュニティ設定画面から招待リンクへの遷移リンク/ボタンが削除されていること
- **実装方針（概要）**: CommunitySettingsPage内の招待リンクセクションを削除
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`

### #44 コミュニティ設定: プロフィール編集+支払い設定の統合

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 「プロフィール編集」と「支払い設定」が「コミュニティ設定」として1画面にまとまっていること
  - 画面内にプロフィール編集セクションと支払い設定セクションが明確に分かれていること
  - 保存ボタンは1つで、両セクションの変更を一括保存できること
- **実装方針（概要）**:
  - CommunitySettingsPageのレイアウトを再構成
  - 2つのフォームセクションを1つのform要素で管理し、submitで一括送信
  - バックエンドのAPIが個別の場合はフロントから2つのAPIを同時に呼ぶ
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`

### #45 コミュニティ設定: 監査ログ→コミュニティ設定変更履歴

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 画面上の「監査ログ」というラベルが「コミュニティ設定変更履歴」に変更されていること
- **実装方針（概要）**: テキスト差し替え
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`

### #47 コミュニティ設定: 未保存時の注意喚起

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: #44（統合後の画面に適用）
- **受入条件**:
  - フォームに未保存の変更がある状態で画面を離れようとすると、確認ダイアログが表示されること
  - ダイアログで「戻る」を選択すると画面遷移がキャンセルされること
  - ダイアログで「破棄」を選択すると変更を破棄して遷移すること
- **実装方針（概要）**:
  - フォームのdirty状態を監視
  - React Routerの`useBlocker`またはブラウザの`beforeunload`イベントで遷移をブロック
  - shadcn/uiのDialogで確認ダイアログを表示
  - #57（マイページ）と共通のカスタムフック`useUnsavedChangesWarning`を作成
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`
  - `frontend/src/shared/`（新規: useUnsavedChangesWarning hook）

### #48 コミュニティ設定: 外部連携を蓋閉じ

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 外部連携セクションがUI上で非表示または「準備中」表示になっていること
  - バックエンドのAPI/機能は変更しないこと
- **実装方針（概要）**:
  - CommunitySettingsPage内の外部連携セクションをコメントアウトまたは条件付きレンダリング（featureGateまたはハードコーディング）で非表示化
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`

---

## サブグループF: その他画面（#30, #52, #55, #57, #58）

### #30 アルバム: 右上の新規作成ボタン廃止

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: #29（Phase 0でFABが修正された後）
- **受入条件**:
  - 画面右上の新規作成ボタンが削除されていること
  - FABからのみ新規作成が可能であること
- **実装方針（概要）**: AlbumTabの右上ボタン要素を削除
- **関連ファイル（推定）**:
  - `frontend/src/features/community/components/detail/tabs/AlbumTab.tsx`

### #52 コミュニティ一覧: FAB化

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - コミュニティ一覧画面にFABが1つ配置されていること
  - FABの左側タップでコミュニティ検索に遷移すること
  - FABの右側タップでコミュニティ作成に遷移すること
  - 既存のヘッダー上の検索/作成ボタンは削除されていること
- **実装方針（概要）**:
  - 左右分割FABコンポーネントを作成（検索アイコン | 作成アイコン）
  - CommunityListPageに配置し、既存のヘッダーボタンを削除
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunityListPage.tsx`

### #55 通知一覧: ステータス名の日本語化

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - `PAID_CANCELLATION` → `返金` と表示されること
  - `SAME_DAY_CANCELLATION` → `当日キャンセル` と表示されること
  - 他のステータスも英名ではなく日本語で表示されていること
- **実装方針（概要）**:
  - フロントにステータス名の英日変換マップを作成
  - NotificationListPageで表示時にマッピング適用
  - 未知のステータスはそのまま表示（フォールバック）
- **関連ファイル（推定）**:
  - `frontend/src/features/notification/pages/NotificationListPage.tsx`

### #57 マイページ: 未保存時アラート

- **分類**: UI改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし（#47と共通hookを作成）
- **受入条件**:
  - マイページで未保存の変更がある状態で戻るボタンを押すと確認ダイアログが表示されること
- **実装方針（概要）**: #47と共通の`useUnsavedChangesWarning`hookを使用
- **関連ファイル（推定）**:
  - `frontend/src/features/user/pages/MyPage.tsx`
  - `frontend/src/shared/`（useUnsavedChangesWarning）

### #58 マイページ: 保存フィードバック

- **分類**: UI改善
- **優先度**: P3
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - 保存成功時にトースト通知（例: 「保存しました」）が表示されること
  - ダイアログなどの手数を増やすUIは使用しないこと
- **実装方針（概要）**:
  - shadcn/uiのsonner（toast）を利用
  - 保存mutationのonSuccess内で`toast.success("保存しました")`を呼び出し
- **関連ファイル（推定）**:
  - `frontend/src/features/user/pages/MyPage.tsx`
  - `frontend/src/shared/components/ui/sonner`

---

## 作業手順（推奨順序）
1. **共通コンポーネント作成**: ImagePreviewModal、useUnsavedChangesWarning、formatRelativeTime
2. **サブグループA**（お知らせ）: #3 → #8 → #6 → #7 → #9 → #2
3. **サブグループB**（コミュニティ詳細）: #10, #11 → #14 → #15
4. **サブグループC**（チャット）: #26, #27 → #28 → #23 → #24 → #22
5. **サブグループD**（アクティビティ）: #34 → #35
6. **サブグループE**（コミュニティ設定）: #48 → #43 → #45 → #44 → #47
7. **サブグループF**（その他）: #30, #52, #55, #57, #58
