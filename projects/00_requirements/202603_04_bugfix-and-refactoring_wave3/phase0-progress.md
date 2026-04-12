# Phase 0 — P0 バグ修正

> **最終更新**: 2026-03-18
> **ステータス**: ✅ Phase 0 完了

## フェーズ概要
- **ゴール**: アクティビティ更新時の参加費更新バグを修正する
- **対象**: W3-01
- **変更対象レイヤー**: API / UseCase（バックエンド中心）
- **規模**: S

## タスク一覧

| タスク                                         | 状態   | 備考                      |
| ---------------------------------------------- | ------ | ------------------------- |
| W3-01 アクティビティ更新時の参加費更新バグ修正 | ✅ 完了 | B案（実行時ID渡し）で実装 |

---

## W3-01 アクティビティ更新時の参加費更新バグ修正

- **分類**: バグ修正
- **優先度**: P0
- **変更対象**: 両方
- **変更レイヤー**: API / UseCase
- **由来**: 積み残し #9
- **依存**: なし

### 現象
- アクティビティ更新画面で参加費を変更して保存すると「スケジュールが見つかりません」エラーが発生する

### 想定原因
- Schedule更新ロジックにおけるID解決の不整合、またはバリデーションの問題
- アクティビティ更新UseCase内でScheduleを更新する際、scheduleIdの解決方法に問題がある可能性
- 参加費（participationFee）の更新時にScheduleの検索条件が合致しないケース

### 受入条件
- アクティビティ更新で参加費を変更しても正常に保存できること
- 既存のスケジュールの参加費が正しく更新されること
- 変更後、アクティビティ詳細画面で更新後の参加費が反映されていること

### 設計判断
- **D-0: 修正方針 → B案（mutation実行時にID引数渡し）** を採用
  - 現状: `useUpdateSchedule(firstSchedule?.id ?? '', id!)` がマウント時に評価され、スケジュール未取得時に `scheduleId = ''` で初期化 → 保存時に空IDでAPIリクエスト → `ScheduleNotFoundError`
  - 修正: `useUpdateSchedule` / `useUpdateActivity` の `mutationFn` が実行時に `{ scheduleId, ...data }` を受け取る形に変更。React Query の `useMutation` の正道に沿う設計
  - `useUpdateActivity` も同パターンに統一

### 調査・修正方針
1. `useUpdateSchedule` フックを B案に改修（実行時ID渡し）
2. `useUpdateActivity` も同様に改修（一貫性）
3. `ActivityEditPage` の呼び出しを修正（`mutateAsync({ scheduleId, ...data })` 形式）

### 関連ファイル（推定）
- `backend/src/application/activity/usecase/` — アクティビティ更新UseCase
- `backend/src/application/schedule/usecase/` — スケジュール更新UseCase
- `backend/src/api/front/activity/` — APIコントローラ
- `frontend/src/features/activity/` — 更新フォーム

---

## 作業ログ
- 2026-03-16: Phase 0 作成。1件のバグ修正を計画。
- 2026-03-17: 設計判断 D-0 確定（B案: mutation実行時ID渡し）。実装着手。
- 2026-03-18: W3-01 実装完了。useUpdateSchedule/useUpdateActivity を B案にリファクタ。全呼び出し元更新。TS ビルド通過。
