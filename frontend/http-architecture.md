# フロントエンド通信アーキテクチャ

## 概要

本プロジェクトのフロントエンド通信は **Fetch API ラッパー (`http<T>()`)** + **TanStack Query v5** の 2 層構成で設計されている。

```
┌─────────────────────────────────────────────────┐
│  UI コンポーネント (ページ / フィーチャー)          │
│  └─ useQuery / useMutation                      │
├─────────────────────────────────────────────────┤
│  features/*/api/*.ts  ← ドメイン別 API 関数       │
│  └─ http<T>() を呼ぶだけ (薄いラッパー)            │
├─────────────────────────────────────────────────┤
│  shared/lib/apiClient.ts  ← 低レベル HTTP 関数   │
│  └─ fetch + credentials:"include"               │
├─────────────────────────────────────────────────┤
│  shared/lib/queryClient.ts ← QueryClient 設定   │
│  shared/lib/queryKeys.ts   ← Key 管理           │
└─────────────────────────────────────────────────┘
```

### 呼び出しフロー

```
コンポーネント
  → useQuery({ queryFn: () => authApi.me() })
    → authApi.me()
      → http<AuthMeResponse>('/v1/auth/me')
        → fetch('/v1/auth/me', { credentials:'include' })
```

UI は TanStack Query のフック経由でのみ通信する。`http()` や `authApi` を直接 `useEffect` + `useState` で呼ぶパターンは使わない。

---

## レイヤー詳細

### 1. `apiClient.ts` — 低レベル HTTP 関数

**役割**: ブラウザの Fetch API を薄くラップし、型安全なリクエスト/レスポンスとエラーハンドリングを提供する。

**エクスポート一覧**:

| エクスポート              | 種別     | 用途                                                          |
| ------------------------- | -------- | ------------------------------------------------------------- |
| `ApiError`                | type     | APIエラー本文の型 (`code`, `message`, `details?`)             |
| `HttpError`               | class    | `!res.ok` 時に throw されるエラー (`status`, `api: ApiError`) |
| `isHttpError(e)`          | function | unknown → HttpError の型ガード                                |
| `http<T>(path, options?)` | function | 汎用 HTTP 関数                                                |

**設計原則**:

- **ドメイン非依存** — URL パスや型をハードコードしない
- **認証は Cookie に委譲** — `credentials: "include"` をデフォルトにし、トークン操作を行わない
- **401 は throw するだけ** — リダイレクト等の副作用は上位層（AuthProvider / 画面）の責務
- **204 No Content 対応** — `T = void` 想定で `undefined` を返す
- **timeout 対応** — `timeoutMs` 指定時に `AbortController` + `setTimeout` で abort

**`http<T>()` のシグネチャ**:

```ts
http<T>(path: string, options?: {
    method?: string                                       // default: 'GET'
    query?: Record<string, string | number | boolean | undefined>
    headers?: Record<string, string>
    json?: unknown                                        // 自動で Content-Type: application/json
    signal?: AbortSignal
    timeoutMs?: number
}): Promise<T>
```

**baseURL**:

```ts
const baseURL = import.meta.env.VITE_API_BASE_URL || ''
```

- 開発時: 空文字 → Vite の `server.proxy` が `/v1` を `http://localhost:3001` に転送
- 本番時: 同一ドメインなら空文字のまま。別ドメインなら環境変数で指定

---

### 2. `queryClient.ts` — QueryClient 設定

**役割**: アプリケーション共通の `QueryClient` インスタンスを生成・管理する。

**デフォルト設定**:

| カテゴリ  | 設定                   | 値                          | 理由                             |
| --------- | ---------------------- | --------------------------- | -------------------------------- |
| queries   | `staleTime`            | 60秒                        | 頻繁な再フェッチを抑制           |
| queries   | `gcTime`               | 20分                        | アンマウント後もキャッシュを保持 |
| queries   | `refetchOnWindowFocus` | false                       | タブ切替時の不要なリクエスト防止 |
| queries   | `retry`                | 最大2回 (non-retryable除外) | 一時的障害に対応                 |
| mutations | `retry`                | 0                           | 副作用の重複実行を防止           |

**リトライ対象外ステータス**: `401`, `403`, `404`, `409`

これらはリトライしても結果が変わらないクライアントエラーのため、即座に失敗させる。

---

### 3. `queryKeys.ts` — Query Key 管理

**役割**: queryKey の命名規則を統一し、`invalidateQueries` の粒度を制御する。

**汎用ユーティリティ**:

```ts
const keys = makeResourceKeys('users')
keys.all        // ['users']               → 全キャッシュ無効化
keys.list(1)    // ['users', 'list', 1]    → ページ別
keys.detail(42) // ['users', 'detail', 42] → 個別
```

**命名ルール**:

1. queryKey は **配列で階層化** する
2. 第1要素は **ドメイン名**（`'auth'`, `'users'`, `'schedules'` 等）
3. params はオブジェクトをそのまま入れず、**固定順の配列** を使う
4. 各ドメインの keys 定義は `queryKeys.ts` に集約するか、`features/*/` 内に配置する

**認証ドメイン用 Key**（先行定義済み）:

```ts
authKeys.all   // ['auth']
authKeys.me()  // ['auth', 'me']
```

---

## エラーハンドリング方針

### エラー型の統一

旧 `ApiErrorResponse`（`shared/types/api.ts`）は廃止し、`apiClient.ts` の `ApiError` に統一した。

```ts
type ApiError = { code: string; message: string; details?: unknown }
```

すべての HTTP エラーは `HttpError` としてスローされ、`status` と `api`（`ApiError`）を持つ。

### 画面での使い方

```ts
const errorMessage = (() => {
    if (!mutation.error) return null
    if (isHttpError(mutation.error)) {
        return getAuthErrorMessage(mutation.error.api.code)  // code → 日本語メッセージ
    }
    return 'エラーが発生しました'
})()
```

### 401 の扱い

- `http()` は `HttpError(401, ...)` を throw するだけ
- `queryClient` のリトライ設定で 401 は即失敗
- 画面遷移は **AuthProvider** が `useQuery(["auth","me"])` の結果を見て行う
- 個別の mutation では `isHttpError(err) && err.status === 401` で判定可能

---

## キャッシュ更新方針

| シナリオ                             | 方式                                        | 理由                                                                     |
| ------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------ |
| **認証系**（login / OAuth / signup） | `setQueryData(["auth","me"], { userId })`   | レスポンスに userId があるため即反映。不要な /auth/me リクエストを避ける |
| **業務ドメイン系**（CRUD 操作）      | `invalidateQueries({ queryKey: keys.all })` | 一覧や関連データの整合性を保つため再取得                                 |

```ts
// 認証系 — 即反映
onSuccess: (result) => {
    qc.setQueryData(authKeys.me(), { userId: result.userId })
}

// 業務系 — 再取得
onSuccess: () => {
    qc.invalidateQueries({ queryKey: scheduleKeys.all })
}
```

---

## Provider 構成

```
<PlatformProvider>      ← プラットフォーム検出 (Web / Capacitor)
  <QueryProvider>       ← QueryClientProvider + DevTools (本番以外)
    <BrowserRouter>
      <AuthProvider>    ← useQuery(["auth","me"]) で認証状態管理
        <Routes />
      </AuthProvider>
    </BrowserRouter>
  </QueryProvider>
</PlatformProvider>
```

- `QueryProvider` は Router に依存しないため `BrowserRouter` の外側
- `AuthProvider` は `useNavigate` を使うため `BrowserRouter` の内側
- `ReactQueryDevtools` は `!import.meta.env.PROD` の場合のみ表示

---

## ファイル一覧

```
shared/lib/
├── apiClient.ts            ← http(), HttpError, ApiError, isHttpError
├── queryClient.ts          ← QueryClient (staleTime/gcTime/retry 設定)
├── queryKeys.ts            ← makeResourceKeys(), authKeys
├── http-architecture.md    ← 本ドキュメント
├── utils.ts                ← cn() (Tailwind ユーティリティ)
└── examples/
    └── queryUsageExample.ts ← useQuery / useMutation の使い方サンプル
```

---

## 新しいドメイン機能を追加する際のチェックリスト

1. `queryKeys.ts` に Key を追加（または `features/*/` 内に定義）
2. `features/<domain>/api/<domain>Api.ts` に API 関数を作成（`http<T>()` を呼ぶだけ）
3. `features/<domain>/hooks/` に `useQuery` / `useMutation` のカスタムフックを作成
4. コンポーネントからはカスタムフック経由でのみ通信する
5. mutation の `onSuccess` では `invalidateQueries` で関連キャッシュを再取得する
