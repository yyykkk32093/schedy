# Phase 2 — コミュニティ詳細レイアウト改修 + アルバム写真動線

> **最終更新**: 2026-03-21
> **ステータス**: ✅ Phase 2 完了

## フェーズ概要
- **ゴール**: フロント大規模UI改修 + アップロード基盤刷新。コミュニティ詳細画面のレイアウト刷新、アルバム写真追加動線の新設、全アップロード箇所の Presigned URL 方式への一括移行
- **対象**: C-13, C-15（+ Presigned URL 基盤移行）
- **変更対象レイヤー**: UI / BE（API）/ インフラ（S3 CORS）
- **規模**: L（C-13: L, C-15: M-L, Presigned URL 移行: M）

## タスク一覧

| タスク                                   | 状態   | 備考                                                                            |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| C-13 コミュニティ詳細画面レイアウト改修  | ✅ 完了 | 4サブコンポーネント分割 + Framer Motion カード重ね展開UI                        |
| D-5 Presigned URL 方式への全箇所一括移行 | ✅ 完了 | BE(getPresignedUploadUrl+confirm) + FE(uploadFile書換) + チャット添付含む全箇所 |
| C-15 アルバム写真追加動線                | ✅ 完了 | FileUploadZone(D&D+ボタン) + AlbumTab写真追加UI                                 |

---

## C-13 コミュニティ詳細画面レイアウト改修

- **分類**: 改善
- **優先度**: P2
- **変更対象**: フロント
- **変更レイヤー**: UI
- **由来**: wave3レビュー [13]
- **依存**: なし

### 設計判断（✅ 確定 2026-03-21）
- **展開UIパターン → c) インライン展開（カード重ね → スタック解除）**
  - 「重ねて配置し選択すると展開」という指摘に最も忠実
  - CSS transform でカード重ねを表現
- **アニメーション実装 → CSS transform + Framer Motion**
  - `framer-motion` を新規導入（`layout` アニメーション活用）
  - カード重ね → 展開のスムーズなアニメーションに最適
- **レスポンシブ対応 → a) モバイルファースト固定**
  - 現状SPAはモバイル中心。PC向けレイアウトは後回し
- **D-4: W4-01 との整合性 → 汎用メタセクション方式**
  - メタ情報（活動場所、頻度、レベル等）をデータ駆動でレンダリング
  - `metaItems` 配列にキー:値ペアを定義 → `.map()` で一括レンダリング
  - W4-01 で項目追加時（年齢層・性別等）はデータ定義に1行追加するだけ
  - `isSearchable` は不要。非公開コミュニティ = 検索対象外のルールで統一

### 現状
- メタ情報がフラットに横並び
- 機能ボタンの位置が散在

### 目標レイアウト（上から順）

```
┌──────────────────────────────────┐
│ カバー画像                        │
├──────────────────────────────────┤
│ アバター + コミュニティ名         │
│ メンバー数 | 公開/非公開 | カテゴリ│  ← 名前の横/直下
├──────────────────────────────────┤
│ コミュニティ説明                  │
├──────────────────────────────────┤
│ [招待] [設定] [統計] [集金管理]   │  ← 機能ボタン: 説明の直下
├──────────────────────────────────┤
│ 📍 活動場所  🚉 最寄駅  📅 開催頻度│  ← 機能ボタンの下
│  (複数ある場合は重ねて展開UI)     │
├──────────────────────────────────┤
│ 🗓 活動日  📊 レベル              │  ← 活動場所/駅の下
├──────────────────────────────────┤
│ 🏷 タグ                           │  ← 最下部
├──────────────────────────────────┤
│ [タブ: お知らせ/アクティビティ/...│
└──────────────────────────────────┘
```

### 活動場所/駅の複数展開UI
- メイン（最前面）のみ表示し、複数ある場合はバッジ数表示（例: `+2`）
- タップで展開 → 全件が見える
- アニメーション付き展開/折りたたみ
- CSS transform でカード重ねを表現

### 実装ステップ

| Step | 内容                                                           | 対象           |
| ---- | -------------------------------------------------------------- | -------------- |
| 1    | コミュニティヘッダー再構成（カバー画像 + アバター + メタ情報） | コンポーネント |
| 2    | 機能ボタンバー（説明の直下に配置）                             | コンポーネント |
| 3    | 活動場所/駅のカード重ねUI（展開/折りたたみ）                   | コンポーネント |
| 4    | 活動日・レベル・タグセクション配置                             | コンポーネント |
| 5    | 全体レイアウト統合・微調整                                     | ページ         |

### 受入条件
- 目標レイアウト通りの上から順の表示になっていること
- 活動場所/駅が複数ある場合、カード重ね → タップ展開のUIが動作すること
- アニメーションが滑らかであること
- 機能ボタンが説明の直下に固まっていること
- 将来の詳細設定項目追加に対応できる余地があること

### 関連ファイル（推定）
- `frontend/src/features/community/` — コミュニティ詳細ページ・ヘッダーコンポーネント

---

## C-15 アルバム写真追加動線

- **分類**: 機能拡張
- **優先度**: P2
- **変更対象**: フロント（既存BE APIを活用）
- **変更レイヤー**: UI
- **由来**: wave3レビュー [15]
- **依存**: なし

### 現状
- アルバム作成はタイトル+説明のみ
- 写真追加UIが完全に欠落
- API（`addPhoto`）は存在する

### 設計判断（✅ 確定 2026-03-21）
- **アップロードUI → c) 両方** — デスクトップはD&D、モバイルはボタンタップ
- **複数同時アップロード → b) 複数選択可** — `input[multiple]` + `Promise.all` 並列アップロード
- **D-5: アップロード方式 → Presigned URL 方式（全箇所一括移行）**
  - 現行のサーバー経由方式（multipart → BE → S3）から Presigned URL 方式に移行
  - FE が BE に署名済み URL を要求 → FE から直接 S3 に PUT → BE に完了確認
  - 全アップロード箇所（アバター・カバー画像・お知らせ添付・チャット添付・アルバム）を一括移行
  - 詳細は「D-5 Presigned URL 移行」セクション参照
- **コンポーネント設計 → 汎用 `FileUploadZone` 新設**
  - `shared/components/` に D&D + ボタン + プレビュー + プログレスの汎用コンポーネント
  - `accept`, `multiple`, `maxFiles` 等を props で制御
  - アルバムだけでなくカバー画像変更等にも再利用可能
- **作成時のフロー → a) 作成後にアルバムIDで写真追加** — シンプル。作成完了 → アルバム詳細へ遷移 → そこで写真追加を促す

### 仕様

#### アルバム作成時の写真追加
- アルバム作成フォームに写真アップロードエリアを追加
- ドラッグ&ドロップエリア + ファイル選択ボタンの併用
- 作成後、アルバム詳細画面へ遷移し写真追加を促す

#### 作成後の写真追加
- アルバム詳細画面に「写真を追加」ボタンを設置
- 既存 `addPhoto` APIを呼び出し
- 複数選択可能（`input[multiple]`）
- アップロード状態（プログレスバー or スピナー）を表示

### 実装ステップ

| Step | 内容                                                                               | 対象           |
| ---- | ---------------------------------------------------------------------------------- | -------------- |
| 1    | ※ Presigned URL 基盤移行が先行（D-5 セクション参照）                               | —              |
| 2    | 汎用 `FileUploadZone` コンポーネント作成（D&D + ボタン + プレビュー + プログレス） | コンポーネント |
| 3    | アルバム作成フォームに `FileUploadZone` を組み込み                                 | ページ         |
| 4    | アルバム詳細画面に「写真を追加」ボタン + `FileUploadZone`                          | ページ         |
| 5    | 複数同時アップロード（`Promise.all` 並列） + プログレス表示                        | コンポーネント |

### 受入条件
- アルバム作成フォームに写真アップロードエリアが表示されること
- ドラッグ&ドロップ + ボタンタップの両方で写真選択できること
- 複数枚同時選択・アップロードができること
- アルバム詳細画面に「写真を追加」ボタンがあり、追加投稿できること
- アップロード中にプログレス表示があること
- アップロード完了後にアルバム詳細がリフレッシュされること
- Presigned URL 経由で S3 に直接アップロードされていること（BE サーバーにファイルバイナリが経由しない）

### 関連ファイル（推定）
- `frontend/src/features/community/` — アルバム関連コンポーネント・ページ
- `frontend/src/shared/lib/uploadFile.ts` — Presigned URL 方式に書き換え
- `frontend/src/shared/components/FileUploadZone.tsx` — 新設: 汎用アップロードコンポーネント
- `backend/src/api/front/upload/routes/uploadRoutes.ts` — Presigned URL エンドポイントに変更
- `backend/src/_sharedTech/storage/S3FileStorageService.ts` — `getPresignedUploadUrl()` 追加
- `backend/src/api/front/album/` — addPhoto API（既存）

---

---

## D-5 Presigned URL 方式への全箇所一括移行

- **分類**: 基盤改善
- **優先度**: P1（C-15 の前提）
- **変更対象**: BE / FE / インフラ
- **変更レイヤー**: API / 共通ユーティリティ / S3設定

### 現状
- 全アップロード箇所（4箇所）が `POST /v1/upload` にファイルバイナリを送信 → BE が multer で受信 → S3 に PutObjectCommand
- ファイルバイナリがBEサーバーのメモリを経由する（10MB × 同時N人 = サーバー負荷）
- `@aws-sdk/s3-request-presigner` はインストール済みだが未使用

### 目標: Presigned URL 方式
```
[ブラウザ]                  [バックエンド]                [S3]
    │                           │                         │
    │  ① POST /v1/upload/url    │                         │
    │  { fileName, mimeType }   │                         │
    │  ─── 数百バイト ────────►  │                         │
    │                           │  ② GetSignedUrl生成     │
    │  ③ { uploadUrl, key }     │  (有効期限5分)          │
    │  ◄──────────────────────  │                         │
    │                           │                         │
    │  ④ PUT uploadUrl          │                         │
    │  ─── ファイルバイナリ ──────────────────────────────►│
    │                           │                         │
    │  ⑤ 200 OK                 │                         │
    │  ◄──────────────────────────────────────────────── │
    │                           │                         │
    │  ⑥ POST /v1/upload/confirm│                         │
    │  { key }                  │                         │
    │  ─── 数百バイト ────────►  │  ⑦ HeadObject(存在確認)│
    │                           │  ──────────────────────►│
    │  ⑧ { url, key }           │                         │
    │  ◄──────────────────────  │                         │
```

### 移行対象（全5箇所）

| #   | 箇所               | FE ファイル                                          | 現在の方式                                                              |
| --- | ------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | ユーザーアバター   | `features/user/pages/MyPage.tsx`                     | `uploadFile()` → `/v1/upload`                                           |
| 2   | コミュニティロゴ   | `features/community/pages/CommunitySettingsPage.tsx` | 同上                                                                    |
| 3   | コミュニティカバー | 同上                                                 | 同上                                                                    |
| 4   | お知らせ添付画像   | `features/community/components/AnnouncementForm.tsx` | 同上                                                                    |
| 5   | チャット添付       | `features/chat/` 内                                  | `/v1/channels/:id/messages/:id/attachments`（DB登録+WebSocket通知付き） |

**注**: チャット添付（#5）は Presigned URL 化 + 完了確認時に DB 登録 + WebSocket 通知のフローにリファクタが必要

### 実装ステップ

| Step | 内容                                                                                         | 対象                   |
| ---- | -------------------------------------------------------------------------------------------- | ---------------------- |
| 1    | `IFileStorageService` に `getPresignedUploadUrl(fileName, mimeType)` メソッド追加            | BE: インターフェース   |
| 2    | `S3FileStorageService` で `@aws-sdk/s3-request-presigner` の `getSignedUrl` 実装             | BE: Infrastructure     |
| 3    | `LocalFileStorageService` にローカル開発用フォールバック実装                                 | BE: Infrastructure     |
| 4    | `POST /v1/upload/url` + `POST /v1/upload/confirm` エンドポイント新設                         | BE: API                |
| 5    | チャット添付: `POST /v1/channels/:id/attachments/url` + `/confirm` 新設（DB登録+WS通知付き） | BE: API                |
| 6    | 旧 `POST /v1/upload` + 旧添付エンドポイントを削除                                            | BE: API                |
| 7    | FE: `uploadFile()` を Presigned URL フローに書き換え（インターフェースは維持）               | FE: 共通ユーティリティ |
| 8    | S3 CORS 設定更新（本番環境用。ローカルは `init-s3.sh` で設定済み）                           | インフラ               |
| 9    | 全アップロード箇所の動作確認                                                                 | E2E                    |

### 受入条件
- 全アップロード箇所（5箇所）が Presigned URL 経由で動作すること
- BE サーバーにファイルバイナリが経由しないこと
- `uploadFile()` のインターフェース（`File → Promise<UploadResult>`）が維持され、呼び出し側の変更が最小限であること
- ローカル開発環境（LocalStack）でも動作すること
- チャット添付のアップロード完了後に MessageAttachment レコードが作成され、WebSocket 通知が送信されること

### 関連ファイル
- `backend/src/_sharedTech/storage/IFileStorageService.ts` — メソッド追加
- `backend/src/_sharedTech/storage/S3FileStorageService.ts` — Presigned URL 生成実装
- `backend/src/_sharedTech/storage/LocalFileStorageService.ts` — フォールバック
- `backend/src/api/front/upload/routes/uploadRoutes.ts` — エンドポイント刷新
- `frontend/src/shared/lib/uploadFile.ts` — フロー書き換え
- `infra/localstack/init-s3.sh` — CORS 設定確認（設定済み）

---

## 作業ログ
- 2026-03-20: Phase 2 作成。2件の大規模UI改修を計画。設計判断を確定（C-13: カード重ねインライン展開 + モバイルファースト、C-15: D&D+ボタン併用 + 作成後に写真追加）。D-4/D-5 の横断的注意事項を記載。
- 2026-03-21: 設計判断すり合わせ完了。D-4: 汎用メタセクション方式（isSearchable削除）、D-5: Presigned URL全箇所一括移行（メッセージ添付含む）、C-13: Framer Motion新規導入、C-15: 汎用FileUploadZone新設。Presigned URL移行を独立セクションとして追加。
- 2026-03-21: Phase 2 全タスク実装完了。
  - D-5: S3FileStorageService に getPresignedUploadUrl/confirmUpload 実装。uploadRoutes.ts に POST /v1/upload/url + POST /v1/upload/confirm 新設。チャット添付も専用 Presigned URL エンドポイント化。FE uploadFile() を Presigned URL 3ステップフロー（URL取得→S3直接PUT→confirm）に書き換え。インターフェース維持。
  - C-13: CommunityProfileHeader を HeroSection + MetaSection + ActionBar + TagSection の4サブコンポーネントに分割。MetaSection はデータ駆動レンダリング（buildMetaData）。活動場所はカード重ね→タップ展開UI（Framer Motion AnimatePresence + motion.div layout）。ActionBar に招待モーダル（LINE/メール/クリップボード共有）付き。
  - C-15: 汎用 FileUploadZone (D&D+クリック+プレビュー+ローディング) を shared/components/ に新設。AlbumTab にアルバム写真追加UI（addPhoto mutation + FileUploadZone）を統合。
