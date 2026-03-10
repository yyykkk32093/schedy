/**
 * 低レベル HTTP 通信関数（fetch ラッパー）
 *
 * UI から直接使うのではなく、TanStack Query の queryFn / mutationFn から呼ぶ。
 *
 * - credentials: "include" — httpOnly Cookie を自動送信
 * - 開発時は Vite の proxy で /v1 → http://localhost:3001 にプロキシ
 * - 401 の特別処理（リダイレクト等）はしない。HttpError を throw するだけ
 */

// ─── エラー型 ─────────────────────────────────────────────

/** API が返すエラー本文の型（旧 ApiErrorResponse を統一） */
export type ApiError = {
    code: string
    message: string
    details?: unknown
}

/** HTTP レスポンスが !ok の場合に throw されるエラー */
export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly api: ApiError,
    ) {
        super(api.message)
        this.name = 'HttpError'
    }
}

/** unknown を HttpError かどうか判定する型ガード */
export function isHttpError(e: unknown): e is HttpError {
    return e instanceof HttpError
}

// ─── HTTP 関数 ────────────────────────────────────────────

const baseURL: string = import.meta.env.VITE_API_BASE_URL || ''

interface HttpOptions {
    method?: string
    query?: Record<string, string | number | boolean | undefined>
    headers?: Record<string, string>
    json?: unknown
    signal?: AbortSignal
    timeoutMs?: number
}

/**
 * fetch ベースの汎用 HTTP 関数
 *
 * @example
 * // GET
 * const users = await http<User[]>('/v1/users')
 *
 * // POST with JSON body
 * const created = await http<User>('/v1/users', { method: 'POST', json: { name: 'Bob' } })
 *
 * // GET with query params
 * const page = await http<Page>('/v1/items', { query: { page: 1, limit: 20 } })
 */
export async function http<T>(
    path: string,
    options: HttpOptions = {},
): Promise<T> {
    const { method = 'GET', query, headers = {}, json, signal, timeoutMs } = options

    // ── URL 組み立て ──
    let url = baseURL + path
    if (query) {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params.append(key, String(value))
            }
        }
        const qs = params.toString()
        if (qs) url += `?${qs}`
    }

    // ── Headers ──
    const reqHeaders: Record<string, string> = { ...headers }
    if (json !== undefined) {
        reqHeaders['Content-Type'] = 'application/json'
    }

    // ── AbortController（timeout） ──
    let controller: AbortController | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (timeoutMs) {
        controller = new AbortController()
        timeoutId = setTimeout(() => controller!.abort(), timeoutMs)
    }

    const effectiveSignal = signal ?? controller?.signal

    try {
        const res = await fetch(url, {
            method,
            headers: reqHeaders,
            body: json !== undefined ? JSON.stringify(json) : undefined,
            credentials: 'include',
            signal: effectiveSignal,
        })

        // ── 204 No Content ──
        if (res.status === 204) {
            return undefined as T
        }

        // ── レスポンスボディの読み取り ──
        const contentType = res.headers.get('content-type') ?? ''
        let body: unknown
        if (contentType.includes('application/json')) {
            body = await res.json()
        } else {
            const text = await res.text()
            body = text || null
        }

        // ── エラーハンドリング ──
        if (!res.ok) {
            const apiError: ApiError =
                body && typeof body === 'object' && 'code' in body
                    ? (body as ApiError)
                    : { code: 'HTTP_ERROR', message: `HTTP ${res.status}` }
            throw new HttpError(res.status, apiError)
        }

        return body as T
    } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
}
