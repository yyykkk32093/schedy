// src/_sharedTech/http/HttpClient.ts
import { HttpIntegrationError, NetworkError } from '@/integration/error/IntegrationError.js'
import { fetch } from 'undici'
import { IHttpClient } from './IHttpClient.js'

export class HttpClient implements IHttpClient {
    async post(url: string, body: any, headers: Record<string, string> = {}) {
        let res: Awaited<ReturnType<typeof fetch>>

        try {
            res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: JSON.stringify(body),
            })
        } catch (err) {
            // ネットワークレベルの障害（DNS解決失敗、接続拒否、タイムアウト等）
            throw new NetworkError(
                `[HttpClient] POST failed (network): ${err instanceof Error ? err.message : String(err)}`,
                err,
            )
        }

        if (!res.ok) {
            const text = await res.text().catch(() => null)
            throw new HttpIntegrationError({
                statusCode: res.status,
                responseBody: text,
                url,
            })
        }

        return res
    }
}
