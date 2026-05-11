# [9] BE の RESTful 評価

> 評価日: 2026-05-11
> 結論: **全体は Good（versioning 統一・resource-oriented）。一部に RPC 風 endpoint と命名不統一**

## 全体評価

| 項目                      | 評価                                |
| ------------------------- | ----------------------------------- |
| Versioning                | ✅ 全エンドポイント `/v1/` 統一      |
| Resource-oriented 命名    | ✅ 大半は名詞・複数形                |
| HTTP メソッドの正しさ     | ✅ GET/POST/PATCH/DELETE 適切        |
| 階層化（nested resource） | ✅ `/communities/:id/members` 等良好 |
| 認証/認可ミドルウェア     | ✅ 集中管理                          |
| ページング/フィルタ       | ✅ クエリパラメータで実装            |

| 区分           | 件数 | feature                                                                                                                                                                                     |
| -------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Good**       | 20+  | Activity, Album, Analytics, Auth(Session), Channel, Chat, Community, Invite, Location, Participation, Schedule, Place, Poll, Stamp, Upload, User, UserSchedule, Webhook, Stripe, RevenueCat |
| **Needs Work** | 10+  | Auth(Password), Auth(OAuth), Billing, Announcement, Bookmark, Inquiry, Master, Matching                                                                                                     |
| **Poor**       | 0    | —                                                                                                                                                                                           |

## 主要なアンチパターン

### A. RPC 風エンドポイント

| 該当                                       | 推奨                                                     |
| ------------------------------------------ | -------------------------------------------------------- |
| `POST /v1/auth/password`                   | `POST /v1/auth/sessions`（戦略を body or path で表現）   |
| `POST /v1/billing/cancel`                  | `DELETE /v1/subscriptions/:id`                           |
| `POST /v1/schedules/:id/append-rounds`     | `POST /v1/schedules/:id/matching/rounds`                 |
| `PATCH /v1/schedules/:id/cancel-or-delete` | クエリパラメータ or 明示的に分離                         |
| `POST /v1/announcements/:id/like`          | `POST /v1/announcements/:id/likes`（リソースとして表現） |
| `POST /v1/communities/:id/bookmark`        | `POST /v1/communities/:id/bookmarks`                     |

### B. 一般化された "masters" リソース

```
GET /v1/masters/community
GET /v1/masters/categories
GET /v1/masters/participation-levels
```

→ "master" という語自体がドメイン用語ではない。
**推奨**: `/v1/categories`, `/v1/participation-levels` のように具体的なリソース名で分割

### C. State 変更のための action sub-resource

| 該当                                                         | コメント                                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `PATCH /announcements/:id/read`                              | `read` を リソース化: `POST /announcements/:id/reads`（ユーザー別の既読作成）か、ユーザー側に `PATCH /me/announcements/:id { isRead: true }` |
| `PATCH /channels/:id/read`                                   | 同上                                                                                                                                         |
| `PATCH /schedules/:id/cancel`, `POST /schedules/:id/restore` | 状態遷移なので action endpoint は許容（一般的）                                                                                              |
| `DELETE /dm/channels/:id/leave`                              | `DELETE /dm/channels/:id` で十分（`/leave` 不要）                                                                                            |

### D. 命名不統一・ネスト不整合

| 該当                                        | 問題                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `DELETE /albums/photos/:photoId`            | アルバム配下にネストすべき: `DELETE /albums/:albumId/photos/:photoId` |
| `DELETE /announcements/comments/:commentId` | 同上: `DELETE /announcements/:id/comments/:commentId`                 |
| `/billing/*` vs `/plans`                    | namespace 不統一（同じ概念領域なら統一）                              |
| `/expenses` vs `/finance/*`                 | 同上                                                                  |

### E. URL 生成系で POST を使用

```
POST /v1/upload/url
POST /v1/communities/:id/connect/dashboard-link
```

副作用（ログ・監査）はあるが、本質は読み取り。GET でも問題ない設計だが、認証や rate-limit ヘッダ要件で POST にしている可能性。意図的なら問題なし。

## 個別 feature の懸念抜粋

### Authentication 周り
- `POST /v1/auth/password` / `POST /v1/auth/oauth/:provider` で命名・構造が分かれている
- 統一案: `POST /v1/auth/sessions` の body に `{ method: "password" | "oauth", provider?: "google" }`

### Master Data
- `/v1/masters/*` をやめ、各リソース個別 endpoint に分解
- 例: `/v1/categories`, `/v1/participation-levels`, `/v1/plans`

### Matching
- `/append-rounds` は `POST /rounds`（コレクション追加）に
- `/fixed-pairs` は OK（リソースとして PATCH）

### Bookmark / Like / Vote (toggle 系)
- toggle 用途で POST を再度叩いて on/off するのは非冪等
- リソース化: `POST /likes`（作成）+ `DELETE /likes/:id`（削除）

## 推奨アプローチ

### Phase 1: 命名・ネスト是正（破壊的変更を伴う）

破壊的なので **API バージョニング** で吸収:
- `/v2/` を新設して新設計を載せる
- `/v1/` は当面維持（フロント移行完了で deprecate）

優先順位:
1. `masters/*` の解体（リスク低）
2. `albums/photos`, `announcements/comments` のネスト是正
3. Auth エンドポイントの統一
4. Toggle 系（like/bookmark/vote）のリソース化

### Phase 2: action endpoint 整理
- `cancel` / `restore` 等の状態遷移系は許容（業界一般的）
- `read` 系は実装方針を統一（リソース化 or PATCH に統合）

### Phase 3: ドキュメント整備
- OpenAPI 仕様書の作成（または更新）
- API Style Guide の整備（命名規則・URL ルール）
- フロント側との合意形成

## OpenAPI 仕様書の現状

要確認: 現状 OpenAPI 仕様書（schemas に Zod はあるが）の自動生成・公開状態。
- `api/schemas/` に Zod スキーマあり → `zod-to-openapi` で自動生成可能
- フロント側との型共有・モック作成にも有用

## 優先度

🟡 **Medium** — RESTful の根本破綻はない。継続的改善で十分対応可能。
🔴 **High** — 新機能追加時の URL 命名はガイドライン化して同パターン再発防止が重要。

## 関連項目
- [6] DDD（Controller 整理と並行）
- [8] ディレクトリ構成（webhook 受信/設定の分離はここでも有効）
