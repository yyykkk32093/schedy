# Phase 1 — P1 バグ修正・データ不整合の解消

## フェーズ概要
- **ゴール**: 主要機能が正しく動作しない問題・データ不整合を全て解消する
- **対象**: #13, #16, #17, #32, #41, #42, #46, #50, #59
- **変更対象レイヤー**: UI / API / UseCase / Domain
- **推定規模**: M（9件。フロントのみ完結6件 + バックエンド修正3件）

---

## #13 コミュニティ詳細: タブ切替時のスクロール位置保持

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - アクティビティタブ→カレンダータブ→戻る、でスクロール位置が維持されること
  - アルバムタブ切替後もスクロール位置が維持されること
  - チャットタブ切替後もスクロール位置が維持されること
- **実装方針（概要）**:
  - タブコンポーネントの表示切替方式を確認。条件付きレンダリング（アンマウント）ではなくCSS display切替（マウント維持）に変更、または各タブのスクロール位置をstate/refで保持
  - `SectionTabs`コンポーネントまたは`CommunityDetailPage`のタブ管理ロジックを修正
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunityDetailPage.tsx`
  - `frontend/src/features/community/components/detail/tabs/`（各タブコンポーネント）
  - `frontend/src/shared/components/SectionTabs.tsx`

---

## #16 コミュニティ詳細: FABの権限制御

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - オーナー・管理者（OWNER/ADMIN）でログイン時、FAB（お知らせ投稿・アクティビティ作成）が表示されること
  - メンバー（MEMBER）でログイン時、FABが非表示であること
  - ロール変更後、リロードなしでFABの表示/非表示が切り替わること
- **実装方針（概要）**:
  - CommunityDetailPageでユーザーのmembershipロールを取得し、FABの表示条件にrole判定を追加
  - `CommunityMembership.role`が`OWNER`または`ADMIN`の場合のみFABを表示
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunityDetailPage.tsx`
  - `frontend/src/features/community/hooks/`（メンバーシップ取得hook）

---

## #17 お知らせタブ: ブックマーク即時反映されない

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - ブックマークボタン押下後、リロードなしでUI上のブックマーク状態が切り替わること
  - ブックマーク状態がサーバーに正しく保存されること
- **実装方針（概要）**:
  - ブックマークAPIのmutation後にReact Queryのキャッシュを更新（楽観的更新またはinvalidateQueries）
  - `AnnouncementTab`内のブックマークトグルハンドラを確認
- **関連ファイル（推定）**:
  - `frontend/src/features/community/components/detail/tabs/AnnouncementTab.tsx`
  - `frontend/src/features/announcement/hooks/`
  - `frontend/src/features/announcement/api/`

---

## #32 アクティビティ作成: 幹事データ不一致

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: 両方
- **変更レイヤー**: UI / API
- **依存**: なし
- **受入条件**:
  - アクティビティ作成画面の幹事選択で表示されるメンバー一覧と、アクティビティ詳細画面の幹事変更モーダルで表示されるメンバー一覧が一致すること
  - いずれもコミュニティの有効なメンバー（退会済み除外）が表示されること
- **実装方針（概要）**:
  - 両画面で呼び出しているAPIエンドポイントを特定し、同一のデータソースを参照するよう統一
  - バックエンド: メンバー一覧取得のUseCaseが異なるクエリ条件を使用していないか確認
  - フロント: `ActivityForm.tsx`と`ActivityDetailPage.tsx`の幹事選択コンポーネントが同じAPIを呼んでいるか確認
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/components/ActivityForm.tsx`
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `backend/src/api/front/community/`（メンバー一覧API）
  - `backend/src/application/community/membership/`

---

## #41 アクティビティ詳細: キャンセル待ち表の条件付き表示

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - `Schedule.capacity`がnull（参加上限なし）の場合、キャンセル待ち一覧テーブルが非表示であること
  - `Schedule.capacity`が設定されている場合は従来通りキャンセル待ち一覧が表示されること
- **実装方針（概要）**:
  - アクティビティ詳細画面でScheduleデータの`capacity`をチェックし、nullまたは0の場合はキャンセル待ちセクションをレンダリングしない
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/pages/ActivityDetailPage.tsx`
  - `frontend/src/features/activity/components/ScheduleCard.tsx`

---

## #42 アクティビティ詳細: 参加費NULL不許容

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: 両方
- **変更レイヤー**: UI / API / Domain / DB
- **依存**: なし
- **受入条件**:
  - アクティビティ作成・更新時に参加費が未入力の場合、0として保存されること
  - 既存のnullデータがある場合、表示上は0または¥0として表示されること
  - バックエンドで参加費nullのリクエストを受けた場合、0にフォールバックすること
- **実装方針（概要）**:
  - フロント: `ActivityForm.tsx`のparticipationFeeフィールドにデフォルト値0を設定。未入力時は0を送信
  - バックエンド: UseCase層で参加費がnull/undefinedの場合に0へ変換するバリデーション追加
  - DB: `Schedule.participationFee`のデフォルト値を0に設定するマイグレーション検討（既存データへの影響確認）
- **関連ファイル（推定）**:
  - `frontend/src/features/activity/components/ActivityForm.tsx`
  - `backend/src/application/schedule/` または `backend/src/application/activity/`
  - `backend/src/domains/activity/schedule/`
  - `backend/prisma/schema.prisma`（Scheduleモデル）

---

## #46 コミュニティ設定: 監査ログの物理名→論理名 & ユーザID→ユーザ名

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: 両方
- **変更レイヤー**: UI / API / UseCase
- **依存**: なし
- **受入条件**:
  - 監査ログの`field`列に物理カラム名ではなく日本語の論理名が表示されること
    - 例: `enabledPaymentMethods` → `支払い方法設定`
  - 設定変更を行ったユーザがユーザIDではなくユーザ名（displayName）で表示されること
  - ロール変更対象ユーザもユーザIDではなくユーザ名で表示されること
- **実装方針（概要）**:
  - 方針A（フロント側マッピング）: フロントに物理名→論理名の変換マップを持ち、表示時に変換
  - 方針B（バックエンド側マッピング）: API応答に論理名を含める
  - → 方針Aを推奨（バックエンドの監査ログ記録ロジックは変更不要。表示責務はフロント）
  - ユーザ名: 監査ログAPIのレスポンスにユーザ情報をJOINして返すよう修正（バックエンド変更必要）
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`
  - `backend/src/api/front/community/`（監査ログ取得API）
  - `backend/src/application/audit/` または `backend/src/application/community/`
  - `backend/src/domains/audit/log/`

---

## #50 コミュニティ設定: プロフィール画像変更が即時反映されない

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - コミュニティのプロフィール画像を変更・保存後、リロードなしで画面上の画像が更新されること
  - ヘッダー、コミュニティ一覧等、表示される全箇所で即時反映されること
- **実装方針（概要）**:
  - 画像アップロード完了後、React Queryのコミュニティ詳細キャッシュをinvalidate
  - または画像URLにタイムスタンプクエリパラメータを付与してブラウザキャッシュを回避
  - アップロードmutationのonSuccess内でキャッシュ更新処理を追加
- **関連ファイル（推定）**:
  - `frontend/src/features/community/pages/CommunitySettingsPage.tsx`
  - `frontend/src/features/community/components/CommunityProfileHeader.tsx`
  - `frontend/src/features/community/hooks/`
  - `frontend/src/shared/lib/queryKeys.ts`

---

## #59 マイページ: プロフィール画像変更が即時反映されない

- **分類**: バグ修正
- **優先度**: P1
- **変更対象**: フロント
- **変更レイヤー**: UI
- **依存**: なし
- **受入条件**:
  - マイページでプロフィール画像を変更後、リロードなしで画面上の画像が更新されること
  - ヘッダー、BottomNav等に表示されるアバターも即時反映されること
- **実装方針（概要）**:
  - #50と同根の問題（画像キャッシュ/クエリキャッシュの無効化漏れ）
  - ユーザープロフィール更新mutationのonSuccessでユーザー関連クエリをinvalidate
  - #50と共通のヘルパー関数にまとめることを推奨
- **関連ファイル（推定）**:
  - `frontend/src/features/user/pages/MyPage.tsx`
  - `frontend/src/features/user/hooks/`
  - `frontend/src/features/user/api/`
  - `frontend/src/shared/lib/queryKeys.ts`

---

## 作業手順
1. #50, #59 は同根の可能性が高いため、画像キャッシュ更新の共通ロジックをまず実装
2. #13（スクロール保持）→ #16（FAB権限）→ #17（ブックマーク）の順にフロントのみ完結するバグを修正
3. #42（参加費NULL）→ #46（監査ログ）→ #32（幹事データ）の順にバックエンド変更を伴うバグを修正
4. #41（キャンセル待ち表示）をフロントで修正
