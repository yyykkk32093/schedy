# W5-22 コミュニティ設定画面 — カテゴリ変更対応

> **最終更新**: 2026-04-12
> **ステータス**: ❌ 未着手

## 概要
- **ゴール**: コミュニティ設定画面でカテゴリを変更可能にする
- **対象**: フロントエンド（CommunitySettingsPage）
- **由来**: wave4 carry-over [7]

---

## タスク一覧

| #   | タスク                                       | 状態     | 備考                                          |
| --- | -------------------------------------------- | -------- | --------------------------------------------- |
| 1   | CommunitySettingsPage にカテゴリ Select 追加 | ❌ 未着手 | タグ変更入力エリアの**上**に配置              |
| 2   | カテゴリ変更時の type 自動解決確認           | ❌ 未着手 | UpdateCommunityUseCase は categoryId 対応済み |
| 3   | カテゴリマスタデータ取得 hook 確認           | ❌ 未着手 | CommunityCreatePage の既存 hook を再利用      |

---

## 実装メモ
- UpdateCommunityUseCase は W5-10 Phase 1.5 で categoryId 対応済み → バックエンド変更不要
- CommunityCreatePage Step3 のカテゴリ選択UIコンポーネントを再利用可能
- category 変更 → communityType が自動解決されるため、type 表示の更新も確認

---

## 作業ログ
- 2026-04-12: タスク分解ファイル作成
