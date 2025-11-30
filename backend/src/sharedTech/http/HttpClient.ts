// src/sharedTech/http/HttpClient.ts
import { fetch } from 'undici'
import { IHttpClient } from './IHttpClient.js'

export class HttpClient implements IHttpClient {
    async post(url: string, body: any, headers: Record<string, string> = {}) {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            const text = await res.text()
            throw new Error(
                `[HttpClient] POST failed status=${res.status} body=${text}`
            )
        }

        return res
    }
}
