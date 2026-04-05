# 繰り返しスケジュール — 業務ルール・設計思想

> **最終更新**: 2026-07-06

---

## 1. 概要

Activity に `recurrenceRule`（RFC 5545 RRULE 文字列）を設定すると、繰り返しスケジュールが自動生成される。

- **生成タイミング**: Activity 作成時 / Activity 更新時（recurrenceRule 変更時）
- **生成期間**: 今日から 1 年先まで
- **上限**: 最大 365 件
- **冪等性**: 同日・同 Activity のスケジュールが既存の場合はスキップ

---

## 2. 設計思想 — Worker 廃止と creation-time 生成

### 旧設計（Worker ベース）

当初は `startRecurrenceWorker.ts` が 1 時間ごとに全 Activity を走査し、14 日先までのスケジュールを逐次 `INSERT` していた。

**課題:**
- Worker が起動していない場合、スケジュールが 1 件しか生成されない
- Worker の起動管理（インフラ依存）が追加の運用負荷になる
- 14 日先の制限では、繰り返しスケジュール一覧の UX が貧弱

### 現設計（creation-time バルク生成）

Worker を廃止し、以下のタイミングでドメインサービス `RecurringScheduleGenerator` が同一トランザクション内でバルク生成する。

| タイミング                             | 処理                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Activity 作成時                        | `CreateActivityUseCase` 内で、初回スケジュール + 1 年分を一括 `createMany`                         |
| Activity 更新時（recurrenceRule 変更） | `UpdateActivityUseCase` 内で、旧ルールに合致しないスケジュールを削除/キャンセル → 新ルールで再生成 |

**メリット:**
- Worker 不要 → インフラ簡素化
- ユーザーが作成直後に 1 年分のスケジュールを確認可能
- 同一トランザクション内で完結 → 整合性保証

---

## 3. ドメインサービス: RecurringScheduleGenerator

**パス**: `backend/src/domains/activity/schedule/domain/service/RecurringScheduleGenerator.ts`

Static Method パターン（PlanToGradePolicy と同様）を採用。

### 3.1 `generateSchedules(activity, existingDates, idGenerator): Schedule[]`

- `RecurrenceRule.reconstruct(ruleString).between(from, to)` で RRULE から日付リストを取得
- `existingDates`（`Set<string>`、`YYYY-MM-DD` 形式）に含まれる日付はスキップ
- Activity のデフォルト属性（startTime, endTime, location, participationFee, visitorFee, capacity）を各 Schedule に引き継ぎ
- 最大 365 件で打ち切り

### 3.2 `findSchedulesToRemove(newRuleString, existingSchedules): Schedule[]`

- 既存スケジュールのうち、**未来 + 未キャンセル** のものをフィルタ
- `newRuleString` が null（繰り返し解除）の場合 → 全未来スケジュールが対象
- `newRuleString` がある場合 → 新ルールの日付セットに含まれないものが対象

---

## 4. recurrenceRule 変更時の処理フロー

```
UpdateActivityUseCase.execute()
  ├─ 旧 recurrenceRule を保持
  ├─ activity.update() で新ルール適用
  ├─ activity.save()
  └─ 旧ルール ≠ 新ルール の場合:
      ├─ findSchedulesToRemove() で削除対象を取得
      ├─ countByScheduleIds() で参加者・待機者を一括チェック
      ├─ 参加者ゼロ → 物理削除 (deleteMany)
      ├─ 参加者あり → 論理キャンセル (schedule.cancel() + save)
      └─ generateSchedules() で新ルールのスケジュールをバルク生成 (saveMany)
```

### 物理削除 vs 論理キャンセル

| 条件                                           | 処理                        | 理由                                                             |
| ---------------------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| Participation = 0 **かつ** WaitlistEntry = 0   | 物理削除 (`deleteMany`)     | FK 制約に抵触しない。不要データを残さない                        |
| Participation > 0 **または** WaitlistEntry > 0 | 論理キャンセル (`cancel()`) | FK Restrict のため物理削除不可。参加者に影響を通知する余地を残す |

---

## 5. 定数

| 定数              | 値  | 説明                            |
| ----------------- | --- | ------------------------------- |
| `MAX_SCHEDULES`   | 365 | 1 Activity あたりの生成上限     |
| `GENERATION_DAYS` | 365 | 生成対象期間（今日から N 日先） |

---

## 6. 将来拡張（CF-2）

繰り返しスケジュールの「この回以降を変更」「全回を変更」パターンの導入。

詳細は `projects/202699_98_committed-features/overview.md` の CF-2 を参照。
