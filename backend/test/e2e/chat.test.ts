// test/e2e/chat.test.ts

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

describeE2E('Chat E2E', () => {
    const ownerId = 'e2e-chat-owner-001'
    const ownerEmail = 'chat-owner@test.com'
    const memberId = 'e2e-chat-member-001'
    const memberEmail = 'chat-member@test.com'

    let communityId: string
    let activityId: string

    beforeEach(async () => {
        await cleanAllTables()

        await createTestUserDirect({ id: ownerId, email: ownerEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: memberId, email: memberEmail, plan: 'FREE' })

        // コミュニティ作成
        const comRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'Chat Test Community' })
        communityId = comRes.body.communityId

        // member を追加
        await request(app)
            .post(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ userId: memberId })

        // アクティビティ作成
        const actRes = await request(app)
            .post(`/v1/communities/${communityId}/activities`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: 'Chat Test Activity' })
        activityId = actRes.body.activityId

        await prisma.outboxEvent.deleteMany({})
        await prisma.auditLog.deleteMany({})
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ========================================
    // Channel 取得（自動作成）
    // ========================================

    it('GET /v1/communities/:communityId/channel → コミュニティチャンネル自動作成', async () => {
        const res = await request(app)
            .get(`/v1/communities/${communityId}/channel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res.status).toBe(200)
        expect(res.body.channelId).toBeDefined()
        expect(res.body.type).toBe('COMMUNITY')

        // 2回目は同じチャンネルIDが返る
        const res2 = await request(app)
            .get(`/v1/communities/${communityId}/channel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res2.body.channelId).toBe(res.body.channelId)
    })

    it('GET /v1/activities/:activityId/channel → アクティビティチャンネル自動作成', async () => {
        const res = await request(app)
            .get(`/v1/activities/${activityId}/channel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res.status).toBe(200)
        expect(res.body.channelId).toBeDefined()
        expect(res.body.type).toBe('ACTIVITY')
    })

    // ========================================
    // Message CRUD
    // ========================================

    it('POST /v1/channels/:channelId/messages → メッセージ送信', async () => {
        // チャンネル取得
        const chRes = await request(app)
            .get(`/v1/communities/${communityId}/channel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
        const channelId = chRes.body.channelId

        // メッセージ送信
        const res = await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ content: 'Hello, world!' })

        expect(res.status).toBe(201)
        expect(res.body.messageId).toBeDefined()

        // DB確認
        const msg = await prisma.message.findUnique({ where: { id: res.body.messageId } })
        expect(msg).not.toBeNull()
        expect(msg!.content).toBe('Hello, world!')
        expect(msg!.senderId).toBe(ownerId)
    })

    it('GET /v1/channels/:channelId/messages → メッセージ一覧（カーソルページネーション）', async () => {
        const chRes = await request(app)
            .get(`/v1/communities/${communityId}/channel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
        const channelId = chRes.body.channelId

        // 3件作成
        for (let i = 0; i < 3; i++) {
            await request(app)
                .post(`/v1/channels/${channelId}/messages`)
                .set('Authorization', bearerToken(ownerId, ownerEmail))
                .send({ content: `Message ${i}` })
        }

        const listRes = await request(app)
            .get(`/v1/channels/${channelId}/messages?limit=2`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(listRes.status).toBe(200)
        expect(listRes.body.messages.length).toBe(2)
        expect(listRes.body.nextCursor).toBeDefined()

        // 次ページ
        const page2 = await request(app)
            .get(`/v1/channels/${channelId}/messages?cursor=${listRes.body.nextCursor}&limit=2`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(page2.status).toBe(200)
        expect(page2.body.messages.length).toBe(1)
        expect(page2.body.nextCursor).toBeNull()
    })

    it('DELETE /v1/messages/:messageId → 送信者のみ削除可能', async () => {
        const chRes = await request(app)
            .get(`/v1/communities/${communityId}/channel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
        const channelId = chRes.body.channelId

        const msgRes = await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ content: 'Delete me' })
        const messageId = msgRes.body.messageId

        // 他ユーザーは削除不可
        const failRes = await request(app)
            .delete(`/v1/messages/${messageId}`)
            .set('Authorization', bearerToken(memberId, memberEmail))

        expect(failRes.status).toBe(403)

        // 送信者は削除可能
        const delRes = await request(app)
            .delete(`/v1/messages/${messageId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(delRes.status).toBe(204)

        const deleted = await prisma.message.findUnique({ where: { id: messageId } })
        expect(deleted).toBeNull()
    })

    // ========================================
    // Thread (replies)
    // ========================================

    it('GET /v1/messages/:messageId/replies → スレッド返信一覧', async () => {
        const chRes = await request(app)
            .get(`/v1/communities/${communityId}/channel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
        const channelId = chRes.body.channelId

        // 親メッセージ
        const parentRes = await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ content: 'Parent message' })
        const parentId = parentRes.body.messageId

        // 返信
        await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(memberId, memberEmail))
            .send({ content: 'Reply 1', parentMessageId: parentId })

        await request(app)
            .post(`/v1/channels/${channelId}/messages`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ content: 'Reply 2', parentMessageId: parentId })

        const repliesRes = await request(app)
            .get(`/v1/messages/${parentId}/replies`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(repliesRes.status).toBe(200)
        expect(repliesRes.body.messages.length).toBe(2)
        expect(repliesRes.body.messages[0].content).toBe('Reply 1')
        expect(repliesRes.body.messages[1].content).toBe('Reply 2')
    })
})
