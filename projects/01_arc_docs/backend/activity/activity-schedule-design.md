# Activity / Schedule 分離設計

> 作成日: 2026-03-07
> 対象ドメイン: `backend/src/domains/activity/`

---

## 1. 概要

本プロジェクトでは「何をするか（Activity）」と「いつやるか（Schedule）」を**独立した集約ルート**として分離している。

```
Activity（集約ルート A）           Schedule（集約ルート B）
├── title                         ├── date
├── description                   ├── startTime
├── defaultLocation               ├── endTime
├── defaultStartTime              ├── location
├── defaultEndTime                ├── capacity
├── recurrenceRule                ├── participationFee
├── createdBy                     ├── status
└── communityId (参照)            ├── activityId (参照)
                                  ├── participants[]
                                  └── payments[]
```

---

## 2. 分離の理由（DDD集約設計）

| 観点                     | Activity + Schedule 合体                                     | 分離（現設計）                       |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------ |
| **ライフサイクル**       | 「朝活」と「3/15の朝活」の生存期間が異なるのに1エンティティ  | ✅ 独立して生成・変更・削除できる     |
| **不変条件**             | 「定員以下」はスケジュール単位の制約なのにActivity集約が管理 | ✅ Schedule集約が自分の不変条件を守る |
| **トランザクション境界** | 1アクティビティに100スケジュール → 全ロック                  | ✅ スケジュール単位でロック           |
| **ユビキタス言語**       | 「アクティビティに参加する」は曖昧                           | ✅ 「スケジュールに参加する」が自然   |
| **テンプレート変更**     | 全件UPDATEが必要                                             | ✅ Activity 1件UPDATEで済む           |

### 合体 + 丸ごとコピー方式も検討したが…

「各回を独立エンティティとしてコピー」すればロック問題は解消するが、**テンプレート情報（タイトル・説明など）が全件に重複**する。アクティビティ名を変更したい場合に100件UPDATEが必要になり、正規化の原則に反する。

---

## 3. `defaultStartTime / defaultEndTime` の存在意義

Activity に持つ `defaultStartTime` / `defaultEndTime` は **画面表示用ではなく、繰り返しスケジュール生成のテンプレート時刻** として存在する。

### 繰り返しルールとの関係

```
Activity
├── recurrenceRule: "RRULE:FREQ=WEEKLY;BYDAY=WE"
├── defaultStartTime: "09:00"    ← テンプレート（裏方）
├── defaultEndTime: "10:00"      ← テンプレート（裏方）
│
│   生成ジョブが RRULE + テンプレート時刻から自動生成 ↓
│
├── Schedule 3/12  09:00〜10:00  (自動生成)
├── Schedule 3/19  10:00〜11:00  (この回のみ個別変更)
├── Schedule 3/26  09:00〜10:00  (自動生成 ← defaultから)
└── Schedule 4/2   09:00〜10:00  (自動生成 ← defaultから)
```

### スケジュール変更時の要件

ユーザーがスケジュールの日時を変更する際、以下の選択肢を提供する：

| 操作               | Activity側                        | Schedule側 | 次回以降の自動生成                    |
| ------------------ | --------------------------------- | ---------- | ------------------------------------- |
| **この回のみ変更** | 変更しない                        | 変更する   | `defaultStartTime` から生成（元通り） |
| **以降すべて変更** | `defaultStartTime/EndTime` を変更 | 変更する   | 新しい `defaultStartTime` から生成    |

→ **`defaultStartTime / defaultEndTime` はテンプレートとして必要**。

---

## 4. 画面表示ルール

### 原則: **表示は常に Schedule 側の日時**

Activity の `defaultStartTime / defaultEndTime` は画面に直接表示しない。

| 画面                           | 表示データソース                              | 備考                                      |
| ------------------------------ | --------------------------------------------- | ----------------------------------------- |
| **アクティビティ詳細（上部）** | `schedules[0].date` + `startTime` + `endTime` | スケジュールがない場合は日時行を非表示    |
| **タイムラインカード**         | `schedule.date` + `startTime` + `endTime`     | ScheduleCard で統一表示                   |
| **カレンダーのドット**         | `schedule.date`                               | スケジュール日付でマーキング              |
| **アクティビティ作成フォーム** | フォーム入力値                                | 入力値は Activity + Schedule の両方に保存 |

### 初回作成時のデータフロー

```
ユーザーがフォームで入力:
  date: "2026-03-15"
  startTime: "09:00"
  endTime: "10:00"
         │
         ▼
  Activity.defaultStartTime = "09:00"    ← テンプレートとして保存
  Activity.defaultEndTime   = "10:00"    ← テンプレートとして保存
  Schedule.date      = 2026-03-15        ← 実データとして保存
  Schedule.startTime = "09:00"           ← 実データとして保存
  Schedule.endTime   = "10:00"           ← 実データとして保存
         │
         ▼
  画面に表示するのは → Schedule 側の日時
```

---

## 5. ディレクトリ構成との対応

```
backend/src/domains/activity/
├── domain/                          ← Activity 集約ルート
│   ├── model/entity/Activity.ts
│   ├── model/valueObject/
│   │   ├── ActivityId.ts
│   │   ├── ActivityTitle.ts
│   │   ├── DefaultLocation.ts
│   │   └── TimeOfDay.ts            ← defaultStartTime/EndTime 用
│   └── repository/IActivityRepository.ts
│
├── schedule/                        ← Schedule 集約ルート（Activity 配下に配置）
│   ├── domain/
│   │   ├── model/entity/Schedule.ts
│   │   ├── model/valueObject/
│   │   │   ├── ScheduleId.ts
│   │   │   ├── ScheduleCapacity.ts
│   │   │   └── ScheduleStatus.ts
│   │   └── repository/IScheduleRepository.ts
│   └── infrastructure/
│       └── repository/ScheduleRepositoryImpl.ts
│
└── infrastructure/
    └── repository/ActivityRepositoryImpl.ts
```

Schedule は Activity のサブディレクトリに配置しているが、**DDD上は独立した集約ルート**である。ディレクトリ階層はドメインの所属関係（Schedule は Activity に紐づく）を表現している。

---

## 6. 関連ドキュメント

- [Prisma/DB運用](../../prisma/prisma.md)
- [バックエンドアーキテクチャ](../../backend_README.md)
- [繰り返しスケジュール生成ジョブ](../../src/job/) — RRULE + defaultStartTime/EndTime を使用
