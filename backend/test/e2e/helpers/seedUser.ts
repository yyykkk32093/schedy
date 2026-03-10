// test/e2e/helpers/seedUser.ts
import { prisma } from '@/_sharedTech/db/client.js'
import request from 'supertest'

/**
 * テスト用ユーザーをサインアップで作成し、JWT トークンを返す
 * サインアップ副作用（Outbox/AuditLog）はクリーンアップ後に呼ぶこと
 */
export async function createTestUser(
    app: any,
    params: {
        email: string
        password: string
        displayName: string
    }
): Promise<{ userId: string; token: string }> {
    const res = await request(app).post('/v1/users').send(params)
    if (res.status !== 201) {
        throw new Error(`createTestUser failed: ${res.status} ${JSON.stringify(res.body)}`)
    }

    // ログインしてトークンを取得
    const loginRes = await request(app)
        .post('/v1/auth/password')
        .send({ email: params.email, password: params.password })
    if (loginRes.status !== 200) {
        throw new Error(`login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`)
    }

    // Cookie からトークンを取得、なければ body から
    let token = ''
    const setCookie = loginRes.headers['set-cookie']
    if (setCookie) {
        const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie
        const match = cookieStr.match(/token=([^;]+)/)
        if (match) token = match[1]
    }
    if (!token && loginRes.body?.token) {
        token = loginRes.body.token
    }

    return { userId: res.body.userId, token }
}

/**
 * テスト用ユーザーを DB に直接作成する（サインアップ副作用なし）
 */
export async function createTestUserDirect(params: {
    id: string
    email?: string
    displayName?: string
    plan?: string
}): Promise<void> {
    await prisma.user.create({
        data: {
            id: params.id,
            email: params.email ?? null,
            displayName: params.displayName ?? 'Test User',
            plan: params.plan ?? 'FREE',
            notificationSetting: {},
        },
    })
}
