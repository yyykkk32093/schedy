# Phase 2 — 小〜中規模バグ修正・UI改善（W5-26 / W5-22 / W5-21）

> **最終更新**: 2026-04-15
> **ステータス**: ✅ Phase 2 完了

## フェーズ概要
- **ゴール**: バグ修正・UI改善 + コミュニティ保存の原子性担保
- **対象**: W5-26, W5-22, W5-21, W5-29
- **変更対象レイヤー**: UI + UseCase + API + Schema（W5-29 で BE 変更あり）
- **規模**: S + S + M + M（計4タスク）

## タスク一覧

| タスク                                       | 状態   | 備考                                               |
| -------------------------------------------- | ------ | -------------------------------------------------- |
| W5-26 アクティビティ ブラウザバック修正      | ✅ 完了 | S。既に `{ replace: true }` 適用済み（調査で判明） |
| W5-29 コミュニティ作成/更新 保存の原子性担保 | ✅ 完了 | M。BE + FE。tags/locations を UseCase 統合         |
| W5-22 コミュニティ設定 カテゴリ変更          | ✅ 完了 | S。設定画面にカテゴリ Select 追加                  |
| W5-21 コミュニティ作成画面 UI修正・機能追加  | ✅ 完了 | M。6サブタスク全完了                               |

## タスク詳細リンク

- [W5-26 アクティビティ ブラウザバック修正](W5-26-activity-browser-back.md) — ✅ 実装済み
- [W5-22 コミュニティ設定 カテゴリ変更](W5-22-community-settings-category.md)
- [W5-21 コミュニティ作成画面 UI修正・機能追加](W5-21-community-create-ui.md)
- [W5-29 コミュニティ作成/更新 保存の原子性担保](W5-29-community-save-atomicity.md)

## 実装順序

```
W5-26（✅ 完了）→ W5-29（M）→ W5-22（S）→ W5-21（M）
                    │              │             │
                    │              │             ├─ [1] 作成後ブラウザバック
                    │              │             ├─ [2] 活動頻度「指定なし」見切れ修正
                    │              │             ├─ [3] 活動拠点入力追加 ← W5-29 BE完了が前提
                    │              │             ├─ [4][5] 年齢Select連動ロジック
                    │              │             └─ [6] 推奨レベル「指定なし」+ カテゴリ必須化
                    │              │
                    │              └─ カテゴリ Select 追加（W5-29 で Settings 統合済みが前提）
                    │
                    ├─ BE: Update/Create UseCase に tags + locations 統合
                    ├─ BE: Schema/Controller 更新
                    ├─ BE: categoryId 必須化 + データ移行
                    └─ FE: Settings ページを単一API呼び出しに統合
```

## 設計判断ログ（2026-04-14）

| #   | テーマ                      | 判断                                    | 備考                                            |
| --- | --------------------------- | --------------------------------------- | ----------------------------------------------- |
| 0   | W5-26 既に実装済み          | ✅ 完了扱い                              | 調査で `{ replace: true }` 適用済みと判明       |
| 1   | W5-21[2] 活動頻度見切れ     | A: `w-28` 拡幅                          | シンプルかつ十分                                |
| 2   | W5-21[3] 活動拠点入力       | B: CreateUseCase にトランザクション統合 | + 更新側も統合（→ W5-29 として独立タスク化）    |
| 3   | W5-21[4][5] 年齢連動        | A: 選択肢の動的フィルタリング           | min > max を入力段階で防止                      |
| 4   | W5-21[6] 推奨レベル指定なし | A: チェックボックスで切替               | デフォルト OFF（指定なし）、ON で Slider 有効化 |
| 5   | W5-21[6] カテゴリ必須化     | C: FE + BE required + データ移行        | createSchema/updateSchema 両方必須化            |
| 6   | Settings 原子性問題         | W5-29 として Phase 2 に追加             | Update UseCase に tags/locations 統合           |

## 作業ログ
- 2026-04-14: Phase 2 progress 作成
- 2026-04-14: 設計判断すり合わせ完了。W5-26 完了確認、W5-29 追加（原子性担保）、カテゴリ必須化（C案: FE+BE+データ移行）
- 2026-04-15: Phase 2 全タスク実装完了
  - W5-29: Prisma migration（categoryId NOT NULL）、communitySchemas 更新、Update/Create UseCase に tags+locations 統合（トランザクション内）、communityController 更新、usecaseFactory DI更新、FE api.ts 型更新、CommunitySettingsPage を単一 mutateAsync に統合
  - W5-22: CommunitySettingsPage にカテゴリ Select（トグルボタン）追加、categoryDirty 追跡、handleSaveAll に categoryId 送信
  - W5-21[1]: CommunityCreatePage navigate に `{ replace: true }` 追加
  - W5-21[2]: 活動頻度 Select の w-24 → w-28 に拡幅
  - W5-21[3]: LocationSettings を CommunitySettingsForm Step3 に追加、CreateUseCase にロケーション統合
  - W5-21[4][5]: 年齢 Select 動的フィルタリング（ageMin/ageMax 相互制約）
  - W5-21[6]: 推奨レベル「指定する」チェックボックス（デフォルトOFF）、カテゴリ必須化（FE バリデーション + BE NOT NULL）
  - Community エンティティ categoryId を string（非null）に統一
