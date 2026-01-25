import { fetch } from 'undici'

export class OAuthHttpClient {
    constructor(private readonly timeoutMs = 10_000) { }

    async postForm<T>(
        url: string,
        body: Record<string, string>,
        headers: Record<string, string> = {}
    ): Promise<T> {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...headers,
                },
                body: new URLSearchParams(body).toString(),
                signal: controller.signal,
            })

            const text = await res.text()

            if (!res.ok) {
                throw new Error(
                    `[OAuthHttpClient] POST form failed status=${res.status} body=${text}`
                )
            }

            return JSON.parse(text) as T
        } finally {
            clearTimeout(timeout)
        }
    }

    async getJson<T>(
        url: string,
        headers: Record<string, string> = {}
    ): Promise<T> {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

        try {
            const res = await fetch(url, {
                method: 'GET',
                headers,
                signal: controller.signal,
            })

            const text = await res.text()

            if (!res.ok) {
                throw new Error(
                    `[OAuthHttpClient] GET failed status=${res.status} body=${text}`
                )
            }

            return JSON.parse(text) as T
        } finally {
            clearTimeout(timeout)
        }
    }
}
