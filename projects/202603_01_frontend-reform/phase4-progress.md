# Phase 4: チャット系画面 — 進捗

> **最終更新**: 2026-03-04
> **ステータス**: ✅ Phase 4 完了

> チャット関連の全2画面をリビルド（1〜2スレッド）

## タスク一覧

| #   | タスク           | ステータス | 対応画面             | スレッド |
| --- | ---------------- | ---------- | -------------------- | -------- |
| 4-1 | チャット一覧画面 | ✅ 完了     | チャット一覧画面.png | —        |
| 4-2 | チャット画面     | ✅ 完了     | チャット画面.png     | —        |

## 設計メモ

- **チャット一覧**: チャンネル/DM一覧 + 最新メッセージプレビュー
- **DM導線**: チャット一覧画面からDMにアクセス（BottomNavには置かない）
- **スタンプ（リアクション）**: チャット画面内の各メッセージに付与（Slackライク）
- **リアルタイム性**: REST ポーリング（refetchInterval）で暫定担保。WebSocket対応はバックログ BL-13
- **検索**: UI先行配置（ローカルフィルタリングのみ）。バックエンド検索APIはバックログ BL-14

## Mockup

- `frontend/mockup/Chats/` 配下の全PNG

## 変更対象ファイル

### バックエンド
- `backend/src/api/front/channel/routes/channelRoutes.ts` — **新規** `GET /v1/channels` エンドポイント

### フロントエンド（新規）
- `frontend/src/features/chat/components/ChannelListItem.tsx` — チャンネル一覧アイテム
- `frontend/src/features/chat/components/ChannelSection.tsx` — アコーディオンセクション
- `frontend/src/features/chat/components/ChatSearchBar.tsx` — 検索バー（ローカルフィルタ）
- `frontend/src/features/chat/components/MessageBubble.tsx` — バブル型メッセージ
- `frontend/src/features/chat/components/MessageInput.tsx` — メッセージ入力エリア
- `frontend/src/features/chat/components/ChatHeader.tsx` — チャット画面ヘッダー
- `frontend/src/features/chat/components/DateSeparator.tsx` — 日付セパレーター

### フロントエンド（更新）
- `frontend/src/features/chat/pages/ChatListPage.tsx` — プレースホルダー → Mockup準拠リビルド
- `frontend/src/features/chat/pages/ChannelPage.tsx` — 機能検証レベル → Mockup準拠UI刷新
- `frontend/src/features/chat/api/chatApi.ts` — `getMyChannels()` 追加
- `frontend/src/features/chat/hooks/useChatQueries.ts` — `useMyChannels` hook + `refetchInterval` 追加
- `frontend/src/shared/types/api.ts` — MyChannelsResponse 型追加
- `frontend/src/shared/lib/queryKeys.ts` — `chatChannelKeys.myChannels()` 追加
- `frontend/src/app/App.tsx` — `/dm` → `/chats` リダイレクト化

## 作業ログ

- 2026-03-04: Phase 4 実装完了。バックエンド `GET /v1/channels` 新設、チャット一覧画面リビルド（3セクションアコーディオン）、チャット画面UI刷新（バブル型メッセージ、日付セパレーター、連続グルーピング、リアクションバー）。DM導線をチャット一覧に統合。WebSocket対応（BL-13）、メッセージ検索API（BL-14）をバックログ化。
