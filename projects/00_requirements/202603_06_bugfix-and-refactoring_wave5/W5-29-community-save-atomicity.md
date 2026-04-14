# W5-29 コミュニティ作成/更新 — 保存の原子性担保

> **最終更新**: 2026-04-14
> **ステータス**: ❌ 未着手

## 概要
- **ゴール**: コミュニティの作成・更新で community 本体 + tags + locations を同一トランザクションで保存し、中途半端な状態を排除する
- **対象**: バックエンド（UseCase / Controller / Schema）+ フロントエンド（Settings / Create ページ）
- **由来**: Phase 2 設計判断時に発見。Settings の `handleSaveAll` が community 更新・tags 保存・locations 保存を別々の API で呼び出しており、一部だけ失敗する中途半端な状態が発生し得る

---

## 現状の問題

### 作成画面（CommunityCreatePage）
- community + tags は CreateCommunityUseCase 内で同一トランザクション → ✅
- locations は UseCase の input に存在しない → ❌ 作成後に別 API で保存するしかない

### 設定画面（CommunitySettingsPage）
- `handleSaveAll` が以下を**並行/逐次で別 API 呼び出し**:
  1. `updateCommunity.mutate(...)` — fire-and-forget（await なし）
  2. `await communityApi.saveTags(...)` — try-catch
  3. `await communityApi.saveLocations(...)` — try-catch
- community 更新成功 + tags/locations 失敗 → 「保存しました」+「失敗しました」が両方出る
- community 更新失敗 + tags/locations 成功 → 失敗通知なし（onError 未定義）
- どのパターンでも**一部だけ変更される中途半端な状態**が発生し得る

---

## タスク一覧

| #   | タスク                                                | 状態     | レイヤー | 備考                                           |
| --- | ----------------------------------------------------- | -------- | -------- | ---------------------------------------------- |
| 1   | UpdateCommunityUseCase に tags / locations を追加     | ❌ 未着手 | BE       | $transaction 内で一括保存                      |
| 2   | updateCommunitySchema に tags / locations を追加      | ❌ 未着手 | BE       | tags: optional, locations: optional            |
| 3   | communityController update() に tags / locations 連携 | ❌ 未着手 | BE       | req.body から抽出して UseCase に渡す           |
| 4   | CreateCommunityUseCase に locations を追加            | ❌ 未着手 | BE       | tags と同様にトランザクション内で保存          |
| 5   | createCommunitySchema に locations を追加             | ❌ 未着手 | BE       |                                                |
| 6   | communityController create() に locations 連携        | ❌ 未着手 | BE       |                                                |
| 7   | CommunitySettingsPage を単一 API 呼び出しに統合       | ❌ 未着手 | FE       | 3つの API → updateCommunity 1回に統合          |
| 8   | CommunityCreatePage に LocationSettings 埋め込み      | ❌ 未着手 | FE       | W5-21[3] と統合。payload に locations を含める |
| 9   | 個別 tags/locations PUT エンドポイントの扱い決定      | ❌ 未着手 | BE       | 残すか廃止するか（後述）                       |

---

## 実装メモ

### BE: UpdateCommunityUseCase

```typescript
// input に追加
tags?: string[]           // undefined = 変更なし, [] = 全削除
locations?: Array<{ type: 'MAIN' | 'SUB'; area: string; station?: string }>
                          // undefined = 変更なし, [] = 全削除

// トランザクション内で:
// 1. community.update(...)
// 2. if (input.tags !== undefined) → deleteMany + createMany
// 3. if (input.locations !== undefined) → deleteMany + createMany
```

- tags の上限チェックは既存の `featureGateService.getCommunityLimit` を使用
- locations の MAIN 最大1件バリデーションは既存ロジック（communityLocationRoutes.ts L84-L88）を移植
- `undefined` と `[]` を区別し、未指定時は既存値を維持

### BE: CreateCommunityUseCase

```typescript
// input に追加（tags は既存）
locations?: Array<{ type: 'MAIN' | 'SUB'; area: string; station?: string }>

// トランザクション内で community + tags + locations を一括作成
```

### FE: CommunitySettingsPage

```typescript
// Before（3つの API）
updateCommunity.mutate({ ...fields })           // fire-and-forget
await communityApi.saveTags(communityId, tags)   // 別 API
await communityApi.saveLocations(communityId, locations) // 別 API

// After（1つの API）
await updateCommunity.mutateAsync({
    ...fields,
    tags: tagsDirty ? editedTags : undefined,
    locations: locationDirty ? editedLocations : undefined,
    categoryId: categoryDirty ? selectedCategoryId : undefined,
})
```

### 個別エンドポイントの扱い

| エンドポイント                      | 方針 | 理由                                           |
| ----------------------------------- | ---- | ---------------------------------------------- |
| PUT `/v1/communities/:id/tags`      | 残す | 将来的に tags だけ変更する画面が出る可能性あり |
| PUT `/v1/communities/:id/locations` | 残す | 同上                                           |

フロントの Settings ページからは呼ばなくなるが、API 自体は残しておく。

---

## 作業ログ
- 2026-04-14: タスクファイル作成。Phase 2 設計判断で発見した原子性問題への対応。
