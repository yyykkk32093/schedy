// src/sharedTech/http/IHttpClient.ts
export interface IHttpClient {
    post(url: string, body: any, headers?: Record<string, string>): Promise<any>
}
