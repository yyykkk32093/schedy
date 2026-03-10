// test/e2e/dm.test.ts

import { prisma } from '@/_sharedTech/db/client.js'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { cleanAllTables } from './helpers/dbCleanup.js'
import { createTestUserDirect } from './helpers/seedUser.js'
import { bearerToken } from './helpers/testAuth.js'
import app from './serverForTest.js'

const describeE2E = process.env.DATABASE_URL
    ? describe.sequential
    : describe.skip

describeE2E('DM E2E', () => {
    const subscriberId = 'e2e-dm-sub-001'
    const subscriberEmail = 'dm-sub@test.com'
    const freeUserId = 'e2e-dm-free-001'
    const freeUserEmail = 'dm-free@test.com'
    const otherUserId = 'e2e-dm-other-001'
    const otherUserEmail = 'dm-other@test.com'

    beforeEach(async () => {
        await cleanAllTables()

        await createTestUserDirect({ id: subscriberId, email: subscriberEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: freeUserId, email: freeUserEmail, plan: 'FREE' })
        await createTestUserDirect({ id: otherUserId, email: otherUserEmail, plan: 'SUBSCRIBER' })

        await prisma.outboxEvent.deleteMany({})
        await prisma.auditLog.deleteMany({})
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ========================================
    // DM Channel 作成
    // ========================================

    it('POST /v1/dm/channels → DM作成（SUBSCRIBER のみ）', async () => {
        const res = await request(app)
            .post('/v1/dm/channels')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ participantIds: [freeUserId] })

        expect(res.status).toBe(201)
        expect(res.body.channelId).toBeDefined()
        expect(res.body.type).toBe('DM')
        expect(res.body.participants).toContain(subscriberId)
        expect(res.body.participants).toContain(freeUserId)
    })

    it('POST /v1/dm/channels → FREE ユーザーは DM 開始不可', async () => {
        const res = await request(app)
            .post('/v1/dm/channels')
            .set('Authorization', bearerToken(freeUserId, freeUserEmail))
            .send({ participantIds: [subscriberId] })

        expect(res.status).toBe(403)
        expect(res.body.code).toBe('FEATURE_RESTRICTED')
    })

    it('POST /v1/dm/channels → 同一参加者セットは既存チャンネルを返す', async () => {
        const res1 = await request(app)
            .post('/v1/dm/channels')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ participantIds: [freeUserId] })

        const res2 = await request(app)
            .post('/v1/dm/channels')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ participantIds: [freeUserId] })

        expect(res2.status).toBe(200) // 既存を返す
        expect(res2.body.channelId).toBe(res1.body.channelId)
    })

    // ========================================
    // DM Channel 一覧
    // ========================================

    it('GET /v1/dm/channels → 自分の DM チャンネル一覧', async () => {
        // DM作成
        await request(app)
            .post('/v1/dm/channels')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ participantIds: [freeUserId] })

        await request(app)
            .post('/v1/dm/channels')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ participantIds: [otherUserId] })

        const listRes = await request(app)
            .get('/v1/dm/channels')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))

        expect(listRes.status).toBe(200)
        expect(listRes.body.channels.length).toBe(2)
    })

    it('GET /v1/dm/channels → 参加していない DM は表示されない', async () => {
        // subscriberId と freeUserId の DM
        await request(app)
            .post('/v1/dm/channels')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ participantIds: [freeUserId] })

        // otherUserId の一覧には表示されない
        const listRes = await request(app)
            .get('/v1/dm/channels')
            .set('Authorization', bearerToken(otherUserId, otherUserEmail))

        expect(listRes.status).toBe(200)
        expect(listRes.body.channels.length).toBe(0)
    })

    // ========================================
    // DM内メッセージ（既存のchat routesを利用）
    // ========================================

    it('DM チャンネル内でメッセージ送受信', async () => {
        // DM作成
        const dmRes = await request(app)
            .post('/v1/dm/channels')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ participantIds: [freeUserId] })
        const channelId = dmRes.body.channelId

        // メッセージ送信
        const msgRes = await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ content: 'DM message' })

        expect(msgRes.status).toBe(201)

        // 一覧取得
        const listRes = await request(app)
            .get(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(freeUserId, freeUserEmail))

        expect(listRes.status).toBe(200)
        expect(listRes.body.messages.length).toBe(1)
        expect(listRes.body.messages[0].content).toBe('DM message')
    })
})
