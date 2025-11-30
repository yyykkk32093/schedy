// test/e2e/FakeHttpClient.ts
import { IHttpClient } from "@/sharedTech/http/IHttpClient.js";
import { logger } from "@/sharedTech/logger/logger.js";
import request from "supertest";

export class FakeHttpClient implements IHttpClient {
    constructor(private readonly app: any) { }

    async post(url: string, body: any, headers?: Record<string, string>): Promise<any> {

        const relative = url.replace(/^https?:\/\/[^/]+/, "");

        logger.debug(
            {
                originalUrl: url,
                relativeUrl: relative,
            },
            "[FakeHttpClient] URL transformation"
        );

        let req = request(this.app).post(relative);

        if (headers) {
            for (const [k, v] of Object.entries(headers)) {
                req = req.set(k, v);
            }
        }

        const res = await req.send(body);

        logger.debug(
            {
                status: res.status,
                body: res.body,
            },
            "[FakeHttpClient] Response"
        );

        if (res.status >= 400) {
            logger.error(
                {
                    status: res.status,
                    body: res.body,
                },
                "[FakeHttpClient] HTTP error"
            );
            throw new Error(`FakeHttpClient HTTP ${res.status}`);
        }

        return res.body;
    }
}
