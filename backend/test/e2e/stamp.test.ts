// test/e2e/stamp.test.ts

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

describeE2E('Stamp & Reaction E2E', () => {
    const subscriberId = 'e2e-stamp-sub-001'
    const subscriberEmail = 'stamp-sub@test.com'
    const freeUserId = 'e2e-stamp-free-001'
    const freeUserEmail = 'stamp-free@test.com'

    let communityId: string
    let channelId: string

    beforeEach(async () => {
        await cleanAllTables()

        await createTestUserDirect({ id: subscriberId, email: subscriberEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: freeUserId, email: freeUserEmail, plan: 'FREE' })

        // コミュニティ作成
        const comRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ name: 'Stamp Test Community' })
        communityId = comRes.body.communityId

        // member 追加
        await request(app)
            .post(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ userId: freeUserId })

        // チャンネル取得
        const chRes = await request(app)
            .get(`/v1/communities/${communityId}/channel`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
        channelId = chRes.body.channelId

        await prisma.outboxEvent.deleteMany({})
        await prisma.auditLog.deleteMany({})
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ========================================
    // Stamp CRUD
    // ========================================

    it('POST /v1/stamps → スタンプ作成（SUBSCRIBER のみ）', async () => {
        const res = await request(app)
            .post('/v1/stamps')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ name: 'thumbsup', imageUrl: 'https://example.com/thumbsup.png' })

        expect(res.status).toBe(201)
        expect(res.body.id).toBeDefined()
        expect(res.body.name).toBe('thumbsup')
    })

    it('POST /v1/stamps → FREE ユーザーはスタンプ作成不可', async () => {
        const res = await request(app)
            .post('/v1/stamps')
            .set('Authorization', bearerToken(freeUserId, freeUserEmail))
            .send({ name: 'smile', imageUrl: 'https://example.com/smile.png' })

        expect(res.status).toBe(403)
        expect(res.body.code).toBe('FEATURE_RESTRICTED')
    })

    it('GET /v1/stamps → 自分のスタンプ一覧', async () => {
        await request(app)
            .post('/v1/stamps')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ name: 'smile', imageUrl: 'https://example.com/smile.png' })

        await request(app)
            .post('/v1/stamps')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ name: 'heart', imageUrl: 'https://example.com/heart.png' })

        const listRes = await request(app)
            .get('/v1/stamps')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))

        expect(listRes.status).toBe(200)
        expect(listRes.body.stamps.length).toBe(2)
    })

    it('DELETE /v1/stamps/:stampId → 自分のスタンプのみ削除可', async () => {
        const createRes = await request(app)
            .post('/v1/stamps')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ name: 'trash', imageUrl: 'https://example.com/trash.png' })
        const stampId = createRes.body.id

        // 他ユーザーは削除不可
        const failRes = await request(app)
            .delete(`/v1/stamps/${stampId}`)
            .set('Authorization', bearerToken(freeUserId, freeUserEmail))

        expect(failRes.status).toBe(403)

        // 自分は削除可能
        const delRes = await request(app)
            .delete(`/v1/stamps/${stampId}`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))

        expect(delRes.status).toBe(204)
    })

    // ========================================
    // Reaction
    // ========================================

    it('POST /v1/messages/:messageId/reactions → リアクション追加', async () => {
        // スタンプ作成
        const stampRes = await request(app)
            .post('/v1/stamps')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ name: 'like', imageUrl: 'https://example.com/like.png' })
        const stampId = stampRes.body.id

        // メッセージ作成
        const msgRes = await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ content: 'React to this!' })
        const messageId = msgRes.body.messageId

        // リアクション追加
        const reactRes = await request(app)
            .post(`/v1/messages/${messageId}/reactions`)
            .set('Authorization', bearerToken(freeUserId, freeUserEmail))
            .send({ stampId })

        expect(reactRes.status).toBe(201)
        expect(reactRes.body.stampId).toBe(stampId)
    })

    it('DELETE /v1/messages/:messageId/reactions/:stampId → リアクション削除', async () => {
        // スタンプ作成
        const stampRes = await request(app)
            .post('/v1/stamps')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ name: 'remove-me', imageUrl: 'https://example.com/remove.png' })
        const stampId = stampRes.body.id

        // メッセージ作成
        const msgRes = await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ content: 'Remove reaction' })
        const messageId = msgRes.body.messageId

        // リアクション追加
        await request(app)
            .post(`/v1/messages/${messageId}/reactions`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ stampId })

        // リアクション削除
        const delRes = await request(app)
            .delete(`/v1/messages/${messageId}/reactions/${stampId}`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))

        expect(delRes.status).toBe(204)

        // DB確認
        const count = await prisma.messageReaction.count({ where: { messageId, stampId } })
        expect(count).toBe(0)
    })

    it('リアクション upsert: 同じスタンプを2回追加しても重複しない', async () => {
        const stampRes = await request(app)
            .post('/v1/stamps')
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ name: 'dup', imageUrl: 'https://example.com/dup.png' })
        const stampId = stampRes.body.id

        const msgRes = await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ content: 'Dup test' })
        const messageId = msgRes.body.messageId

        await request(app)
            .post(`/v1/messages/${messageId}/reactions`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ stampId })

        await request(app)
            .post(`/v1/messages/${messageId}/reactions`)
            .set('Authorization', bearerToken(subscriberId, subscriberEmail))
            .send({ stampId })

        const count = await prisma.messageReaction.count({
            where: { messageId, userId: subscriberId, stampId },
        })
        expect(count).toBe(1)
    })
})
