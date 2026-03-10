# 📋 Phase 4 実装進捗トラッカー — 付加価値

> **最終更新**: 2026-02-15
> **ベース**: [memo.md](memo.md) の Phase 4 計画
> **対象**: Stamp/Reaction UI, ファイル添付/S3, ビジター色分け, Docker インフラ
> **ステータス**: ✅ 完了

---

## 4-2. Stamp + MessageReaction ✅ 完了

| タスク                             | 状態 | 備考                                                            |
| ---------------------------------- | ---- | --------------------------------------------------------------- |
| Stamp エンティティ                 | ✅ 済 | Phase 2 で実装済み                                              |
| MessageReaction エンティティ       | ✅ 済 | Phase 2 で実装済み                                              |
| カスタムスタンプ登録 API           | ✅ 済 | Phase 2 で実装済み                                              |
| リアクション追加 / 削除 API        | ✅ 済 | Phase 2 で実装済み                                              |
| リアクション UI (トグル/ピッカー)  | ✅ 済 | Phase 4 で追加: ChannelPage にクリックトグル + StampPickerModal |
| useAddReaction / useRemoveReaction | ✅ 済 | Phase 4 で追加                                                  |

---

## 4-3. ファイル / 写真添付 + S3 ✅ 完了

| タスク                           | 状態 | 備考                                                            |
| -------------------------------- | ---- | --------------------------------------------------------------- |
| ファイルストレージ（S3）         | ✅ 済 | S3FileStorageService 実装, LocalStack で開発                    |
| IFileStorageService              | ✅ 済 | Phase 2 で定義済み, Phase 4 で S3 実装追加                      |
| MessageAttachment エンティティ   | ✅ 済 | Phase 2 で実装済み                                              |
| アップロード API                 | ✅ 済 | POST /v1/upload, POST /v1/channels/:id/messages/:id/attachments |
| 📎 ファイル添付 UI                | ✅ 済 | ChannelPage に添付ボタン + プレビュー追加                       |
| Community logoUrl / coverUrl     | ✅ 済 | Prisma マイグレーション + フルスタック実装                      |
| Docker (PostgreSQL + LocalStack) | ✅ 済 | docker-compose.yml, infra/localstack/init-s3.sh                 |
| AppSecretsLoader S3Config        | ✅ 済 | S3_BUCKET, S3_REGION, S3_ENDPOINT 対応                          |

---

## 4-7. ビジター / 登録参加者の色分け ✅ 完了

| タスク                         | 状態 | 備考                                                |
| ------------------------------ | ---- | --------------------------------------------------- |
| UI 上のビジター表示区別        | ✅ 済 | ScheduleDetailPage でビジターバッジ表示             |
| FeatureGate 適用               | ✅ 済 | canUse('VISITOR_BADGE') で PREMIUM コミュニティのみ |
| Participation.isVisitor の活用 | ✅ 済 | Phase 1 で実装済み                                  |

---

## インフラ改善 ✅ 完了

| タスク                   | 状態 | 備考                                         |
| ------------------------ | ---- | -------------------------------------------- |
| Docker Compose           | ✅ 済 | PostgreSQL 14 + LocalStack (S3)              |
| Logout ボタンアクセス    | ✅ 済 | AppLayout にヘッダー + ログアウトボタン追加  |
| 汎用ファイルアップロード | ✅ 済 | frontend/src/shared/lib/uploadClient.ts 作成 |

---

## 移動済み（→ Backlog）

以下は phase-backlog-progress.md に移動済み:

- ~~4-1. 定例 Schedule 自動生成~~
- ~~4-4. 外部カレンダーエクスポート~~
- ~~4-5. Slack / LINE / Discord 通知連携~~
- ~~4-6. 一括リマインド~~

---

## 決定済み事項

| 項目                               | 決定値                                            | 決定日     |
| ---------------------------------- | ------------------------------------------------- | ---------- |
| ファイルストレージ                 | **S3** + `IStorageService` インターフェース抽象化 | 2026-02-14 |
| ローカル開発 S3                    | **LocalStack** (Docker)                           | 2026-02-15 |
| ローカル DB                        | **PostgreSQL 14** (Docker)                        | 2026-02-15 |
| カスタムスタンプの有料ユーザー上限 | **100**（SUBSCRIBER）                             | 2026-02-10 |
| Community logoUrl/coverUrl         | Phase 4-3（ファイル添付）と同時実装               | 2026-02-14 |
| フロントエンド方針                 | **Web先行**。Capacitor ネイティブは Backlog へ    | 2026-02-14 |
| Phase 5 リネーム                   | **Backlog**（連番なし）                           | 2026-02-15 |
| 4-1/4-4/4-5/4-6                    | **Backlog へ移動**                                | 2026-02-15 |
