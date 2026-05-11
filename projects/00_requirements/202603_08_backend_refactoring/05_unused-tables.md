# [5] 未使用 API・モデル の完全評価（フロント連動分析）

> 評価日: 2026-05-11
> 評価方針: 未稼働システムのため **データ件数ではなく "API がフロントから呼ばれているか" を基準** に判定
> 結論: **完全な「Prisma model レベル」の未使用は 0。ただし "フロントから呼ばれていない backend エンドポイント" が複数存在し、その中に DeviceToken 関連のような重大な機能不全候補が含まれる**

---

## 評価方法

1. **Backend 側**: `backend/src/api/` 配下の全ルーターファイルから、エンドポイント (METHOD + path) と、それが触る Prisma model を列挙
2. **Frontend 側**: `frontend/src/features/*/api/*.ts` および `frontend/src` 全体から HTTP 呼び出しを列挙
3. **クロスリファレンス**: backend エンドポイントごとに「frontend から呼ばれているか？」を判定
4. **モデル単位の集計**: 各モデルが「frontend から到達可能なエンドポイント」を 1 つ以上持つかを判定

実際に主要なルーターファイル・グレップで内容を検証済み。

---

## 1. 未使用エンドポイント一覧（Frontend から呼ばれていない backend API）

### 🔴 完全未使用（フロントから一切呼ばれていない）

| エンドポイント                                      | 該当ファイル                                                                                                      | 触るモデル          | 影響                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------- |
| `POST /v1/device-tokens`                            | [deviceTokenRoutes.ts:16](../../../backend/src/api/front/deviceToken/routes/deviceTokenRoutes.ts#L16)             | `DeviceToken`       | **致命的** — Push 通知の登録ができない |
| `DELETE /v1/device-tokens/:token`                   | [deviceTokenRoutes.ts:57](../../../backend/src/api/front/deviceToken/routes/deviceTokenRoutes.ts#L57)             | `DeviceToken`       | **致命的** — Push 通知の解除ができない |
| `POST /v1/communities/:communityId/locations`       | [communityLocationRoutes.ts:115](../../../backend/src/api/front/community/routes/communityLocationRoutes.ts#L115) | `CommunityLocation` | 中 — フロントは PUT のみ使用           |
| `DELETE /v1/communities/:communityId/locations/:id` | [communityLocationRoutes.ts:170](../../../backend/src/api/front/community/routes/communityLocationRoutes.ts#L170) | `CommunityLocation` | 中 — 単体削除はフロントから不要        |

### 🟡 確認推奨（grep で frontend から見つけられない or 限定箇所のみ）

下記は「frontend のコード検索で呼出を検出できなかった」もの。完全な未使用と確定するには追加調査が必要。

| エンドポイント                                 | 状況                   | 備考                                                     |
| ---------------------------------------------- | ---------------------- | -------------------------------------------------------- |
| `POST /v1/inquiries` (認証あり)                | フロントから呼出未検出 | フロントは `POST /v1/inquiries/anonymous` 中心。将来用？ |
| `GET /v1/inquiries` (ユーザー側履歴)           | フロントから呼出未検出 | ユーザー向け問い合わせ履歴ページ未実装の可能性           |
| `POST /v1/inquiries/:id/messages` (ユーザー側) | フロントから呼出未検出 | 同上（ユーザーが追加質問する画面未実装？）               |
| `GET /v1/inquiries/:id` (ユーザー側)           | フロントから呼出未検出 | 同上                                                     |

→ **問い合わせ機能は admin 側のみ完成・ユーザー側は未実装の可能性**。プロダクト確認が必要。

### ✅ 一見孤立だが実は使用されているもの

| 確認項目                                        | 結果                                                                                                                                                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PATCH /v1/notifications/read-all`              | フロント [notificationApi.ts](../../../frontend/src/features/notification/api/notificationApi.ts) から呼出あり ✅ ([notificationRoutes.ts:120](../../../backend/src/api/front/notification/routes/notificationRoutes.ts#L120)) |
| `POST/DELETE /v1/messages/:messageId/reactions` | フロント [stampApi.ts:23](../../../frontend/src/features/stamp/api/stampApi.ts#L23) から POST 呼出あり ✅                                                                                                                      |
| `GET /v1/admin/system-admins`                   | フロント [inquiryApi.ts](../../../frontend/src/features/inquiry/api/inquiryApi.ts) から呼出あり ✅                                                                                                                             |
| Stripe / RevenueCat webhook 受信                | 外部サービスから呼ばれるため frontend 呼出は不要 ✅                                                                                                                                                                            |

---

## 2. モデル単位の到達可能性

### ❗ 重要な発見: `DeviceToken` の "片肺運転"

| 役割                                                                                                                                                                  | 状態                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **書き込み**（API でユーザーがトークン登録/解除）                                                                                                                     | ❌ フロントから呼出ゼロ → DB は常に空 |
| **読み込み**（[PushNotificationIntegrationHandler.ts:32](../../../backend/src/integration/dispatcher/handler/PushNotificationIntegrationHandler.ts#L32) で FCM 送信） | ✅ コードは存在                       |

→ Push 通知の送信コード（FCM 統合）は完成しているが、**トークン登録 API がフロントから呼ばれないため絶対に届かない**。
→ ネイティブアプリ (iOS/Android) 側の実装を待っている、もしくはモバイル統合プロジェクト [202604_05_ios-native](../202604_05_ios-native/) / [202604_05_android-native](../202604_05_android-native/) の作業対象とみられる。

### 全 68 モデルの到達可能性まとめ

**フロントから到達可能なエンドポイントを 1 つ以上持つモデル**: **65 / 68**

| 状態                   | モデル                                                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ 到達可能（API 経由） | 65 モデル（auth/community/activity/schedule/participation/announcement/album/expense/chat/poll/notification/inquiry/help/stamp/master/webhook 等すべて）                                             |
| ⚠️ 部分到達             | `DeviceToken` — 読み込みのみ。書き込みパスがフロントに無い                                                                                                                                           |
| ✅ 内部用途             | `OutboxEvent`, `OutboxRetryPolicy`, `OutboxDeadLetter`, `AuthAuditLog`, `CommunityAuditLog`, `ParticipationAuditLog`, `WaitlistAuditLog`, `AuthSecurityState` — 監査・非同期基盤として正しく内部利用 |

→ **完全な未使用モデルはゼロ**。ただし上記 `DeviceToken` のような片肺運転は要対応。

---

## 3. CommunityWebhookConfig の特別調査

target.md で個別に名指しされているため詳細評価:

| 項目                              | 結果                                                                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend Repository / UseCase 実装 | ✅ あり（[_usecaseFactory.ts:158](../../../backend/src/api/_usecaseFactory.ts#L158)）                                                            |
| 該当 API エンドポイント           | `GET / PUT / DELETE /v1/communities/:communityId/webhooks` ([webhookRoutes.ts](../../../backend/src/api/front/webhook/routes/webhookRoutes.ts)) |
| Frontend からの呼出               | ✅ [webhookApi.ts](../../../frontend/src/features/webhook/api/webhookApi.ts) から GET/PUT/DELETE すべて呼出あり                                  |
| 通知送信での参照                  | ✅ Announcement/Poll 系 UseCase で WebhookConfig を取得して外部送信                                                                              |

→ **使用中**。削除不要。

---

## 4. その他 "薄い" feature の使用状況

| Feature                         | 状態             | コメント                                                                                                                                                                                       |
| ------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Album                           | ✅ 使用中         | [albumApi.ts](../../../frontend/src/features/album/api/albumApi.ts) で全 5 エンドポイント呼出                                                                                                  |
| Poll                            | ✅ 使用中         | [pollApi.ts](../../../frontend/src/features/poll/api/pollApi.ts) で全 5 エンドポイント呼出                                                                                                     |
| Matching                        | ✅ 使用中         | [matchingApi.ts](../../../frontend/src/features/matching/api/matchingApi.ts) で全 10 エンドポイント呼出                                                                                        |
| Webhook 設定                    | ✅ 使用中         | 上記                                                                                                                                                                                           |
| Expense / Finance               | ✅ 使用中         | フロントで全エンドポイント呼出                                                                                                                                                                 |
| Help Feedback                   | ✅ 使用中         | [HelpArticlePage.tsx](../../../frontend/src/features/help/pages/HelpArticlePage.tsx#L111) と [AdminHelpFeedbackPage.tsx](../../../frontend/src/features/admin/pages/AdminHelpFeedbackPage.tsx) |
| Inquiry (anonymous)             | ✅ 使用中         | フロント問い合わせフォーム                                                                                                                                                                     |
| Inquiry (authenticated user 側) | ⚠️ 未確認         | 上記「確認推奨」を参照                                                                                                                                                                         |
| Inquiry (admin 側)              | ✅ 使用中         | 管理画面で使用                                                                                                                                                                                 |
| DM (チャネル作成/取得)          | ⚠️ leave のみ確認 | 作成は WebSocket 経由か。要確認                                                                                                                                                                |

---

## 5. 推奨アクション

### 🔴 優先度 High

#### A. DeviceToken パイプラインの活性化判断
- 現状: 登録 API が呼ばれず、Push 通知が **絶対に届かない**
- 選択肢:
  1. ネイティブアプリ実装 ([ios-native](../202604_05_ios-native/), [android-native](../202604_05_android-native/)) 完成まで凍結し、コードに `// TODO: native app integration` コメントを明示
  2. PWA / Web Push 経由でフロントから登録できるようにする（`Notification.requestPermission()` + Service Worker）
- どちらにせよ「現在は非機能」を明記しておく

#### B. 問い合わせ（ユーザー側）の機能完成判断
- `POST /v1/inquiries` / `GET /v1/inquiries` / `GET /v1/inquiries/:id` / `POST /v1/inquiries/:id/messages` がフロント未実装
- ユーザーが認証ありで問い合わせをして、自分の履歴を見るフローが組まれていない
- 現状: 匿名問い合わせのみ機能 + admin 対応
- 製品意思決定: 「ユーザー履歴ページを作る」or「これらのエンドポイントを削除する」

### 🟡 優先度 Medium

#### C. CommunityLocation の重複エンドポイント整理
- `POST /v1/communities/:communityId/locations` (個別作成) → 削除候補
- `DELETE /v1/communities/:communityId/locations/:id` (個別削除) → 削除候補
- フロントは `PUT` (一括 upsert) だけ使う設計
- 削除すれば DDD 違反 [6] のうち 1 ファイル分の Prisma 直叩きが減る ([communityLocationRoutes.ts:7](../../../backend/src/api/front/community/routes/communityLocationRoutes.ts#L7))

### 🟢 優先度 Low

#### D. デッドコード検出の継続的運用
本評価は静的調査。継続的に未使用 API を検出するため:

```bash
# ts-prune で未使用 export を検出
pnpm dlx ts-prune

# Express ルーターに対してアクセスログで実利用を継続監視
# (本番環境のロガーで METHOD + path を集計)
```

---

## 6. まとめ

| 観点                                              | 結果                                 |
| ------------------------------------------------- | ------------------------------------ |
| **完全に使われていない Prisma model**             | **0 件**                             |
| **フロントから呼ばれない backend エンドポイント** | **4 件確定 + 4 件要確認**            |
| **片肺運転モデル**                                | **1 件**（`DeviceToken` — 機能不全） |
| **target.md 名指しの `CommunityWebhookConfig`**   | **使用中**（削除不要）               |

### 重要な気付き

- 当初想定していた「未使用テーブル削除」よりも、**「未使用エンドポイント削除」と「Push 通知の機能不全対処」の方が大きな価値**
- DDD 違反 [6] の対象ファイル ([communityLocationRoutes.ts](../../../backend/src/api/front/community/routes/communityLocationRoutes.ts), [stampRoutes.ts](../../../backend/src/api/front/stamp/routes/stampRoutes.ts) 等) は、未使用エンドポイント削除と同時にリファクタすると効率的
- ネイティブアプリ案件 ([202604_05_ios-native](../202604_05_ios-native/), [202604_05_android-native](../202604_05_android-native/)) と DeviceToken パイプラインの整合性確認が必要

## 関連項目
- [6] DDD 違反（CommunityLocation の不要 endpoint 削除と統合可能）
- [9] RESTful 評価（一部 endpoint 整理と統合可能）
- 別案件: [202604_05_ios-native](../202604_05_ios-native/), [202604_05_android-native](../202604_05_android-native/) — DeviceToken の登録パスがここで埋まる想定
