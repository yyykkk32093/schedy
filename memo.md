# 📋 プロダクト設計書（Schedy）

> この文書は、コンセプト・料金体系・ドメインモデル・機能制限・技術的実現性・実装フェーズを整理した設計資料です。
> 設計相談・改修・拡張・レビューにおける前提資料として使用します。
>
> 作成日: 2026-02-08

---

## 1. プロダクトコンセプト

### 概要

コミュニティ（サークル・会社・クラブ等）の予定を管理するアプリケーション。
「運動クラブ」だけでなく、会社や任意の団体を含む広義の「コミュニティ」を対象とする。

### コアバリュー

- コミュニティ単位でのActivity（活動）管理
- Schedule（具体的な予定）への出欠管理
- コミュニティ/Activity/DM単位のチャット機能
- 管理者向けの運営支援ツール（決済・分析・リマインド等）

---

## 2. ドメインモデル

### ドメイン分類

```
┌─────────────────────────────────────────────────────┐
│  Core Domains（コアドメイン＝差別化の源泉）           │
│  ├── Community    … サークル/チーム/組織の管理        │
│  ├── Activity     … 活動の種類 + 定例ルール           │
│  ├── Schedule     … 具体的な1回の予定                 │
│  └── Messaging    … チャット・DM・スレッド            │
├─────────────────────────────────────────────────────┤
│  Supporting Domains（支援ドメイン）                    │
│  ├── Billing      … 料金プラン・決済・サブスク管理     │
│  ├── Analytics    … 参加率レポート・出欠統計           │
│  └── Notification … 通知連携（Slack/LINE/Discord）    │
├─────────────────────────────────────────────────────┤
│  Generic Domains（汎用ドメイン）                       │
│  ├── Auth         … 認証・認可                        │
│  ├── User         … ユーザープロファイル               │
│  └── Audit        … 監査ログ                          │
└─────────────────────────────────────────────────────┘
```

### 概念モデル全体図

```
User (plan: FREE|SUBSCRIBER|LIFETIME)
  ├── AuthCredentials (Password|Google|LINE|Apple)
  ├── AuthSecurityState
  ├── CommunityMembership[] ──→ Community (role: OWNER|ADMIN|MEMBER)
  └── Stamp[] (created by)

Community (grade: FREE|PREMIUM, 再帰構造)
  ├── parent: Community | null
  ├── children: Community[]
  ├── memberships: CommunityMembership[]
  ├── activities: Activity[]
  │     └── schedules: Schedule[]
  │           ├── participations: Participation[] (ATTENDING|CANCELLED)
  │           └── waitlistEntries: WaitlistEntry[] (WAITING|PROMOTED|CANCELLED)
  ├── chatChannel: ChatChannel (type=COMMUNITY)
  └── announcements: Announcement[]
        └── readStatuses: AnnouncementRead[]

Activity (活動種類 + 定例ルール)
  └── chatChannel: ChatChannel (type=ACTIVITY)

ChatChannel (COMMUNITY|ACTIVITY|DM)
  └── messages: Message[]
        ├── thread: Message[] (parentMessageId)
        ├── attachments: MessageAttachment[]
        └── reactions: MessageReaction[] ──→ Stamp

DM = ChatChannel(type=DM) + DMParticipant[]
```

### Activity ↔ Schedule の関係

```
Activity: 「バドミントン練習」（活動の種類 + 繰り返しルール）
  ├── defaultLocation: ○○体育館
  ├── defaultStartTime: 10:00
  ├── defaultEndTime: 12:00
  ├── recurrenceRule: 毎週土曜
  │
  └── Schedule(2/8):  location=○○体育館, 10:00-12:00  ← デフォルトからコピー
  └── Schedule(2/15): location=△△体育館, 10:00-12:00  ← 場所だけ上書き
  └── Schedule(2/22): CANCELLED                        ← この回だけ中止
```

- **Activity** = 「何をするか」＋「繰り返しパターン（あれば）」。statusなし。論理削除（deletedAt）。
- **Schedule** = 「いつ・どこで」の確定した1回。status: SCHEDULED | CANCELLED。capacity（定員）を持ち、isFull は算出。
- **Participation** = 参加表明。status: ATTENDING | CANCELLED。レコード不在 = 未回答。
- **WaitlistEntry** = キャンセル待ち。自動繰り上げ＋辞退可能。

### コミュニティの階層構造（再帰構造）

```
ルートA (parentId: null, depth: 0)
  ├── サブ1 (parentId: A, depth: 1)
  │     ├── サブ1-1 (parentId: サブ1, depth: 2)
  │     └── サブ1-2 (parentId: サブ1, depth: 2)
  └── サブ2 (parentId: A, depth: 1)
```

- ルートもサブも同一の `Community` エンティティ（parentId の有無で区別）
- 最大3階層（depth: 0, 1, 2）
- 並列可能
- サブコミュニティ作成権限: OWNERのみ
- 親のOWNERは子の管理権限を持つ（ADMINは継承しない）
- 親に参加 ≠ 子にも自動参加（明示的に参加。ただし親メンバーは参加申請なしで入れる）
- Activityは任意階層のCommunityに紐づく

---

## 3. エンティティ定義

### User

```
User
  ├── id: UserId
  ├── displayName: DisplayName | null
  ├── email: EmailAddress | null
  ├── phone: PhoneNumber | null
  ├── biography: Biography | null
  ├── avatarUrl: AvatarUrl | null
  ├── notificationSetting: UserNotificationSetting
  ├── plan: FREE | SUBSCRIBER | LIFETIME          ← 新規
  ├── createdAt: Date
  └── updatedAt: Date

※ 旧 User.role (MEMBER|ADMIN) は廃止 → CommunityMembership.role に移行
※ 認証系（PasswordCredential, GoogleCredential 等）と AuthSecurityState は既存維持
```

### CommunityMembership

```
CommunityMembership
  ├── id: string
  ├── communityId: CommunityId
  ├── userId: UserId
  ├── role: OWNER | ADMIN | MEMBER
  └── joinedAt: Date
```

### Community

```
Community
  ├── id: CommunityId
  ├── parentId: CommunityId | null          ← null = ルート
  ├── grade: FREE | PREMIUM                 ← OWNERのplanに連動
  ├── name: string
  ├── description: string | null
  ├── logoUrl: string | null
  ├── coverUrl: string | null
  ├── depth: number                          ← 0=ルート, 最大2 (3階層)
  ├── createdAt: Date
  └── updatedAt: Date
```

### Activity

```
Activity
  ├── id: ActivityId
  ├── communityId: CommunityId
  ├── title: string
  ├── description: string | null
  ├── defaultLocation: string | null
  ├── defaultStartTime: Time | null
  ├── defaultEndTime: Time | null
  ├── recurrenceRule: RecurrenceRule | null
  ├── createdBy: UserId
  ├── deletedAt: Date | null                 ← 論理削除
  ├── createdAt: Date
  └── updatedAt: Date
```

### Schedule

```
Schedule
  ├── id: ScheduleId
  ├── activityId: ActivityId
  ├── date: Date
  ├── startTime: Time
  ├── endTime: Time
  ├── location: string | null
  ├── note: string | null
  ├── status: SCHEDULED | CANCELLED
  ├── capacity: number | null                ← 定員（nullなら上限なし）。isFull は算出。
  ├── createdAt: Date
  └── updatedAt: Date
```

### Participation

```
Participation
  ├── id: string
  ├── scheduleId: ScheduleId
  ├── userId: UserId
  ├── status: ATTENDING | CANCELLED
  ├── isVisitor: boolean                     ← ビジター参加者フラグ
  ├── respondedAt: Date
  └── cancelledAt: Date | null               ← キャンセル日時（当日キャンセル判定用）
```

### WaitlistEntry

```
WaitlistEntry
  ├── id: string
  ├── scheduleId: ScheduleId
  ├── userId: UserId
  ├── position: int                          ← 待ち順（1, 2, 3...）
  ├── status: WAITING | PROMOTED | CANCELLED
  ├── registeredAt: Date
  ├── promotedAt: Date | null
  └── cancelledAt: Date | null
```

キャンセル待ち繰り上げフロー:
1. 参加者がキャンセル → Participation.status = CANCELLED → 空きが出る
2. ApplicationEvent（ParticipationCancelledEvent）発行
3. WaitlistPromotionSubscriber が position=1 の WaitlistEntry を取得
4. 自動で Participation 作成（ATTENDING）＋ WaitlistEntry.status = PROMOTED
5. 繰り上げ通知を送信（通知先はユーザー設定に基づく）
6. 都合悪い場合は通常のキャンセルフローで対応 → 次の待ち順に繰り上げ

### ChatChannel

```
ChatChannel
  ├── id: string
  ├── type: COMMUNITY | ACTIVITY | DM
  ├── communityId: CommunityId | null
  ├── activityId: ActivityId | null
  ├── createdAt: Date
  └── updatedAt: Date
```

### Message

```
Message
  ├── id: string
  ├── channelId: string
  ├── senderId: UserId
  ├── parentMessageId: string | null         ← スレッド（null=トップレベル。1階層のみ）
  ├── content: string
  ├── mentions: UserId[]
  ├── isPinned: boolean                      ← 有料ユーザーのみ
  ├── createdAt: Date
  └── updatedAt: Date
```

### MessageAttachment

```
MessageAttachment
  ├── id: string
  ├── messageId: string
  ├── fileUrl: string
  ├── fileName: string
  ├── fileSize: number
  ├── mimeType: string                       ← image/png, application/pdf 等
  └── createdAt: Date
```

### DMParticipant

```
DMParticipant
  ├── id: string
  ├── channelId: string
  ├── userId: UserId
  └── joinedAt: Date
```

### Announcement

```
Announcement
  ├── id: string
  ├── communityId: CommunityId
  ├── authorId: UserId                       ← OWNER or ADMIN
  ├── title: string
  ├── content: string
  ├── createdAt: Date
  └── updatedAt: Date
```

### AnnouncementRead

```
AnnouncementRead
  ├── id: string
  ├── announcementId: string
  ├── userId: UserId
  └── readAt: Date
```

### Stamp

```
Stamp
  ├── id: string
  ├── createdByUserId: UserId
  ├── name: string
  ├── imageUrl: string
  └── createdAt: Date
```

### MessageReaction

```
MessageReaction
  ├── id: string
  ├── messageId: string
  ├── userId: UserId
  ├── stampId: string
  └── createdAt: Date

  @@unique([messageId, userId, stampId])
```

---

## 4. 料金体系

### プラン構成

| プラン         | 価格                                                 | 対象                                               |
| -------------- | ---------------------------------------------------- | -------------------------------------------------- |
| **FREE**       | 無料                                                 | 全ユーザーのデフォルト                             |
| **SUBSCRIBER** | 月額 250円 or 320円（App Store価格帯に合わせ要決定） | 月額サブスクリプション                             |
| **LIFETIME**   | 5,980円（年1回限定販売）                             | 買い切り。SUBSCRIBERと同等機能。永続。新機能も反映 |

### コミュニティグレード

| グレード    | 条件                           |
| ----------- | ------------------------------ |
| **FREE**    | OWNERが無料ユーザー            |
| **PREMIUM** | OWNERが SUBSCRIBER or LIFETIME |

- grade は OWNERのplanに連動（CommunityGradePolicy に集約）
- OWNER移譲時、新OWNERが無料なら grade は FREE に降格
- 降格時: 既存メンバーは維持。新規参加を制限するのみ
- 将来の組織単位課金への移行余地あり（grade を独立フィールドとして保持しているため）

### Apple / Google 税

- App Store / Google Play 経由の課金は売上の 15〜30% が手数料
- Small Business Program（年商100万ドル以下）で 15%
- 月額320円 → 手取り約272円、買い切り5,980円 → 手取り約5,083円
- App Store価格は自由設定不可（価格帯から選択: 160円, 250円, 320円, 400円, 480円...）

---

## 5. プラン × ロール 制限マトリクス

### ユーザープラン別制限

| 制限項目                               | FREE                  | SUBSCRIBER / LIFETIME                           |
| -------------------------------------- | --------------------- | ----------------------------------------------- |
| 参加コミュニティ数                     | 5つ                   | 無制限（※要上限検討）                           |
| ルートコミュニティ作成                 | 1つ                   | 要検討                                          |
| サブコミュニティ作成（OWNER時）        | 3つ（並列＋階層合計） | 10つ                                            |
| カスタムスタンプ登録                   | 5個                   | 無制限（※要上限検討）                           |
| 広告表示                               | あり                  | なし                                            |
| DM新規開始                             | ❌                     | ✅                                               |
| DM受信・返信                           | ✅                     | ✅                                               |
| コミュニティチャット参加               | ✅                     | ✅                                               |
| チャット検索                           | ❌                     | ✅（全参加サークル/特定サークル/発信者絞り込み） |
| ファイル/写真添付                      | ❌                     | ✅                                               |
| ピン留め・ブックマーク                 | ❌                     | ✅                                               |
| 外部カレンダーエクスポート             | ❌                     | ✅                                               |
| Slack/LINE/Discord通知連携             | ❌                     | ✅                                               |
| アクティビティの外部アプリエクスポート | ❌                     | ✅                                               |
| 過去アクティビティ履歴閲覧             | 直近6ヶ月（可変）     | 無制限                                          |

### コミュニティグレード別制限

| 制限項目                                     | FREE grade     | PREMIUM grade         |
| -------------------------------------------- | -------------- | --------------------- |
| メンバー上限                                 | 30人（可変）   | 無制限（※要上限検討） |
| 副管理者（ADMIN）設定                        | ❌（OWNERのみ） | ✅                     |
| コミュニティカスタマイズ（ロゴ・カバー画像） | ❌              | ✅                     |
| 参加費の決済受付（Apple Pay/PayPay等）       | ❌              | ✅                     |
| 定例Schedule自動生成                         | ❌              | ✅                     |
| 支払い催促・支払い状態可視化                 | ❌              | ✅                     |
| 参加状況CSV出力                              | ❌              | ✅                     |
| 会計情報出力                                 | ❌              | ✅                     |
| ビジター/登録参加者の色分け                  | ❌              | ✅                     |
| 参加者への一括リマインド（テンプレ付き）     | ❌              | ✅                     |
| 参加率レポート（活動別/月別）                | ❌              | ✅                     |
| 欠席/当日キャンセルが多い人の把握            | ❌              | ✅                     |
| 参加者の増減推移                             | ❌              | ✅                     |
| AI連携                                       | ❌              | ✅                     |

### 初期リリースではFREEでも開放する機能（可変）

| 機能                       | 初期設定 | 将来的に制限検討   |
| -------------------------- | -------- | ------------------ |
| アクティビティ月間作成上限 | 無制限   | 回数制限導入検討   |
| 出欠確認の自動リマインド   | FREE開放 | 有料限定に移行検討 |

---

## 6. 機能制限の実装方式

### ハイブリッド方式

```
コードで管理:
  ├── Feature enum（個人向け機能の列挙）         ← 型安全
  ├── CommunityFeature enum（コミュニティ向け）  ← 型安全
  └── FeatureGate（判定ロジック + キャッシュ）

DBで管理:
  ├── UserFeatureRestriction      … ユーザープラン × 機能ON/OFF
  ├── UserLimitRestriction        … ユーザープラン × 数量上限
  ├── CommunityFeatureRestriction … コミュニティグレード × 機能ON/OFF
  └── CommunityLimitRestriction   … コミュニティグレード × 数量上限
```

### テーブル定義

```
UserFeatureRestriction
  ├── id: string
  ├── plan: string           … 'FREE' | 'SUBSCRIBER' | 'LIFETIME'
  ├── feature: string        … Feature enumの値
  └── enabled: boolean
  @@unique([plan, feature])

UserLimitRestriction
  ├── id: string
  ├── plan: string
  ├── limitKey: string       … 'maxJoinCommunities' | 'maxCustomStamps' 等
  └── value: int             … -1 = 無制限
  @@unique([plan, limitKey])

CommunityFeatureRestriction
  ├── id: string
  ├── grade: string          … 'FREE' | 'PREMIUM'
  ├── feature: string        … CommunityFeature enumの値
  └── enabled: boolean
  @@unique([grade, feature])

CommunityLimitRestriction
  ├── id: string
  ├── grade: string
  ├── limitKey: string       … 'maxMembers' 等
  └── value: int
  @@unique([grade, limitKey])
```

### 制御の流れ

```
DB (Restriction テーブル)
  → バックエンド (FeatureGate + インメモリキャッシュ)
    → API middleware (requireFeature → 403返却)
    → GET /v1/me レスポンス (features/limits を含む)
      → フロント (UI表示制御: 🔒アイコン、グレーアウト等)
```

- フロントに機能マッピング定数は持たせない（APIから配信）
- バックエンドでの検証は必須（課金回避防止）
- DB変更 → キャッシュリフレッシュ → 即反映（デプロイ不要）

---

## 7. 技術的実現性

### 既に実装済みの基盤

| 基盤                                     | 状態                                 |
| ---------------------------------------- | ------------------------------------ |
| DDD レイヤ構造（API/Application/Domain） | ✅ 確立済み                           |
| 認証（Password/Google/LINE/Apple）       | ✅ 実装済み                           |
| ApplicationEventBus + Subscriber         | ✅ 実装済み                           |
| Outboxパターン + Worker + DLQ            | ✅ 基盤済み（エラーハンドリング未完） |
| Activity エンティティ                    | ⚠️ 再設計が必要                       |
| User エンティティ                        | ⚠️ plan追加・role廃止が必要           |

### 新規開発の難易度

| 機能                              | 難易度 | 工数感 | 備考                                         |
| --------------------------------- | ------ | ------ | -------------------------------------------- |
| Community CRUD + 再帰構造         | ★★☆    | 中     | 自己参照リレーション。深さ制限バリデーション |
| CommunityMembership               | ★★☆    | 中     | OWNER移譲＋grade連動が要注意                 |
| Activity 再設計                   | ★★☆    | 中     | リネーム＋Community紐づけ＋RecurrenceRule    |
| Schedule                          | ★☆☆    | 小     | 既存Activityのフィールドをほぼ引き継ぐ       |
| Participation + WaitlistEntry     | ★★☆    | 中     | 繰り上げのイベント連携がポイント             |
| RecurrenceRule + Schedule自動生成 | ★★★    | 大     | rrule.js活用。cronジョブ or Worker拡張       |
| FeatureGate + 制限テーブル        | ★★☆    | 中     | 4テーブル＋キャッシュ＋middleware＋seed      |
| チャット基盤（WebSocket）         | ★★★    | 特大   | 最も工数が大きい。Socket.io導入              |
| スレッド・メンション              | ★★☆    | 中     | チャット基盤に依存                           |
| DM（複数人招待可）                | ★★☆    | 中     | チャット基盤に依存                           |
| ファイル/写真添付                 | ★★★    | 大     | S3等ファイルストレージ                       |
| Announcement + 既読管理           | ★★☆    | 中     | CRUD＋既読ステータス                         |
| Stamp + MessageReaction           | ★★☆    | 中     | 画像アップロード＋リアクションUI             |
| サブスクリプション決済            | ★★★    | 大     | Apple IAP / Google Play Billing              |
| 参加費決済                        | ★★★    | 大     | 決済プロバイダ統合                           |
| 外部カレンダーエクスポート        | ★★☆    | 中     | iCal / Google Calendar API                   |
| Slack/LINE/Discord通知連携        | ★★☆    | 中     | 既存Outboxパターン活用                       |
| CSV/会計出力                      | ★☆☆    | 小     | サーバーサイド集計                           |
| 参加率レポート/統計               | ★★☆    | 中     | 集計クエリ＋フロント可視化                   |
| AI連携                            | ★★★    | 不明   | 要件未定                                     |

### 技術的リスク

| リスク                                   | 対策                                      |
| ---------------------------------------- | ----------------------------------------- |
| WebSocket導入でExpress構成に大きな変更   | Socket.ioをExpressに並列追加。段階的導入  |
| RecurrenceRuleの複雑性                   | rrule.jsライブラリ活用                    |
| Apple IAP / Google Play Billing の複雑さ | RevenueCat等のサービス利用を検討          |
| OWNER移譲時のgrade降格の整合性           | CommunityGradePolicyに集約＋E2Eテスト必須 |
| キャンセル待ち繰り上げのrace condition   | トランザクション＋行ロック or 楽観ロック  |

---

## 8. 実装フェーズ

### Phase 0: 基盤整備（既存の技術負債解消）

- [ ] Outbox エラーハンドリング強化（Error Taxonomy / DLQ拡張）
- [ ] API層の共通例外ハンドリングmiddleware
- [ ] User エンティティに plan 追加、role 廃止
- [ ] 既存Activity エンティティの移行準備

### Phase 1: コアドメイン（Community + Activity + Schedule）

```
1-1. Community エンティティ + スキーマ + マイグレーション
     ├── 再帰構造（parentId, depth）
     ├── grade: FREE | PREMIUM
     └── CRUD API

1-2. CommunityMembership
     ├── role: OWNER | ADMIN | MEMBER
     ├── 参加/脱退/OWNER移譲
     └── grade連動ロジック（CommunityGradePolicy）

1-3. Activity 再設計
     ├── Community紐づけ
     ├── defaultLocation / defaultStartTime / defaultEndTime
     ├── 論理削除（deletedAt）
     └── RecurrenceRule は Phase 1 では null 固定（手動Schedule作成のみ）

1-4. Schedule
     ├── Activity紐づけ
     ├── date / startTime / endTime / location / capacity
     ├── status: SCHEDULED | CANCELLED
     └── CRUD API

1-5. Participation + WaitlistEntry
     ├── 参加表明 / キャンセル
     ├── キャンセル待ち登録
     ├── 自動繰り上げ（ApplicationEvent連携）
     └── isFull 算出
```

### Phase 2: コミュニケーション

```
2-1. ChatChannel + Message 基盤
     ├── WebSocket 導入（Socket.io）
     ├── メッセージ永続化
     └── コミュニティチャット（Community作成時に自動生成）

2-2. スレッド（parentMessageId）

2-3. メンション（@ユーザー名 → 通知トリガー）

2-4. DM（ChatChannel type=DM + DMParticipant）

2-5. Announcement + 既読管理
```

### Phase 3: 課金 + 機能制限

```
3-1. FeatureGate 基盤
     ├── 4テーブル作成 + seed投入
     ├── キャッシュ機構
     ├── requireFeature middleware
     └── /v1/me にfeatures/limits含める

3-2. サブスクリプション決済
     ├── Apple IAP / Google Play Billing（or RevenueCat）
     ├── User.plan 更新ロジック
     └── Webhookによるステータス同期

3-3. 買い切りプラン（年1回限定販売）
     ├── Non-Consumable IAP
     └── 販売期間制御

3-4. 参加費決済
     ├── Apple Pay / PayPay等
     ├── 支払い催促
     └── 支払い状態可視化
```

### Phase 4: 付加価値

```
4-1. 定例Schedule自動生成（RecurrenceRule + rrule.js + cronジョブ）
4-2. Stamp + MessageReaction
4-3. ファイル/写真添付（S3 + アップロードAPI）
4-4. 外部カレンダーエクスポート（iCal / Google Calendar API）
4-5. Slack/LINE/Discord通知連携（Outboxパターン活用）
4-6. 一括リマインド（テンプレ付き）
4-7. ビジター/登録参加者の色分け
```

### Phase 5: 分析 + 高度機能

```
5-1. 参加率レポート（活動別/月別）
5-2. 欠席/当日キャンセル把握
5-3. 参加者増減推移
5-4. 参加状況CSV出力
5-5. 会計情報出力
5-6. AI連携（要件定義から）
```

---

## 9. 未決定事項

| 項目                                    | 現状                        | 判断タイミング |
| --------------------------------------- | --------------------------- | -------------- |
| サブスク月額の最終価格                  | 250円 or 320円              | Phase 3 着手前 |
| SUBSCRIBER のルートコミュニティ作成上限 | 未決定                      | Phase 1 着手前 |
| SUBSCRIBER の参加コミュニティ数上限     | 未決定（無制限？100？）     | Phase 3 着手前 |
| カスタムスタンプの有料ユーザー上限      | 未決定（無制限？100？）     | Phase 4 着手前 |
| PREMIUM のメンバー上限                  | 未決定（無制限？1000？）    | Phase 1 着手前 |
| 決済プロバイダ                          | Apple IAP直接 vs RevenueCat | Phase 3 着手前 |
| ファイルストレージ                      | S3 / CloudFlare R2 等       | Phase 4 着手前 |
| インフラ構成                            | AWS / Railway / Render 等   | 要別途検討     |

---

## 10. コードベースとのギャップ

| 現状                                       | 必要な変更                                             |
| ------------------------------------------ | ------------------------------------------------------ |
| User に role: MEMBER \| ADMIN がある       | plan: FREE \| SUBSCRIBER \| LIFETIME に変更。role 廃止 |
| Activity エンティティが「1回の開催」の構造 | Schedule にリネーム。上位にActivityを新設              |
| Community が存在しない                     | 新規作成（スキーマ＋エンティティ＋API全部）            |
| Participation / Reservation が空           | Participation 実装。Reservation は廃止                 |
| チャット基盤なし                           | WebSocket導入から                                      |
| 課金基盤なし                               | Phase 3 で着手                                         |