// test/e2e/announcement.test.ts

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

describeE2E('Announcement E2E', () => {
    const ownerId = 'e2e-ann-owner-001'
    const ownerEmail = 'ann-owner@test.com'
    const memberId = 'e2e-ann-member-001'
    const memberEmail = 'ann-member@test.com'
    const outsiderId = 'e2e-ann-outsider-001'
    const outsiderEmail = 'ann-outsider@test.com'

    let communityId: string

    beforeEach(async () => {
        await cleanAllTables()

        await createTestUserDirect({ id: ownerId, email: ownerEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: memberId, email: memberEmail, plan: 'FREE' })
        await createTestUserDirect({ id: outsiderId, email: outsiderEmail, plan: 'FREE' })

        // コミュニティ作成
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'Announcementテスト用' })
        communityId = createRes.body.communityId

        // member を追加
        await request(app)
            .post(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ userId: memberId })

        // Outbox/Audit クリア
        await prisma.outboxEvent.deleteMany({})
        await prisma.auditLog.deleteMany({})
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ========================================
    // Announcement CRUD
    // ========================================

    it('POST /v1/communities/:communityId/announcements → お知らせ作成（OWNER）', async () => {
        const res = await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: '重要なお知らせ', content: '本文です' })

        expect(res.status).toBe(201)
        expect(res.body.announcementId).toBeDefined()

        // DB確認
        const ann = await prisma.announcement.findUnique({
            where: { id: res.body.announcementId },
        })
        expect(ann).not.toBeNull()
        expect(ann!.title).toBe('重要なお知らせ')
        expect(ann!.content).toBe('本文です')
        expect(ann!.communityId).toBe(communityId)
        expect(ann!.authorId).toBe(ownerId)
        expect(ann!.deletedAt).toBeNull()
    })

    it('GET /v1/communities/:communityId/announcements → お知らせ一覧', async () => {
        // 2つ作成
        await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: 'お知らせ A', content: '内容A' })
        await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: 'お知らせ B', content: '内容B' })

        const listRes = await request(app)
            .get(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(listRes.status).toBe(200)
        expect(Array.isArray(listRes.body.announcements)).toBe(true)
        expect(listRes.body.announcements.length).toBe(2)
    })

    it('GET /v1/communities/:communityId/announcements → isRead が反映される', async () => {
        const createRes = await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: '既読テスト', content: '内容' })

        // 未読
        const listBefore = await request(app)
            .get(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(memberId, memberEmail))
        expect(listBefore.body.announcements[0].isRead).toBe(false)

        // 既読にする
        await request(app)
            .patch(`/v1/announcements/${createRes.body.announcementId}/read`)
            .set('Authorization', bearerToken(memberId, memberEmail))

        // 既読
        const listAfter = await request(app)
            .get(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(memberId, memberEmail))
        expect(listAfter.body.announcements[0].isRead).toBe(true)
    })

    it('GET /v1/announcements/:id → お知らせ詳細', async () => {
        const createRes = await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: '詳細テスト', content: '詳しい内容' })

        const findRes = await request(app)
            .get(`/v1/announcements/${createRes.body.announcementId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(findRes.status).toBe(200)
        expect(findRes.body.title).toBe('詳細テスト')
        expect(findRes.body.content).toBe('詳しい内容')
    })

    it('DELETE /v1/announcements/:id → お知らせ論理削除（OWNER）', async () => {
        const createRes = await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: '削除対象', content: '消します' })

        const deleteRes = await request(app)
            .delete(`/v1/announcements/${createRes.body.announcementId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(deleteRes.status).toBe(204)

        const after = await prisma.announcement.findUnique({
            where: { id: createRes.body.announcementId },
        })
        expect(after!.deletedAt).not.toBeNull()
    })

    it('PATCH /v1/announcements/:id/read → 既読マーク（冪等）', async () => {
        const createRes = await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: '既読テスト', content: '内容' })

        const readRes1 = await request(app)
            .patch(`/v1/announcements/${createRes.body.announcementId}/read`)
            .set('Authorization', bearerToken(memberId, memberEmail))
        expect(readRes1.status).toBe(204)

        // 2回目も冪等に成功
        const readRes2 = await request(app)
            .patch(`/v1/announcements/${createRes.body.announcementId}/read`)
            .set('Authorization', bearerToken(memberId, memberEmail))
        expect(readRes2.status).toBe(204)

        // DB確認
        const reads = await prisma.announcementRead.findMany({
            where: { announcementId: createRes.body.announcementId, userId: memberId },
        })
        expect(reads.length).toBe(1)
    })

    // ========================================
    // 権限チェック
    // ========================================

    it('一般メンバーはお知らせ作成不可 → 403', async () => {
        const res = await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(memberId, memberEmail))
            .send({ title: 'メンバー試行', content: '不可' })

        expect(res.status).toBe(403)
    })

    it('一般メンバーはお知らせ削除不可 → 403', async () => {
        const createRes = await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: 'テスト', content: '内容' })

        const deleteRes = await request(app)
            .delete(`/v1/announcements/${createRes.body.announcementId}`)
            .set('Authorization', bearerToken(memberId, memberEmail))

        expect(deleteRes.status).toBe(403)
    })

    it('認証なし → 401', async () => {
        const res = await request(app)
            .post(`/v1/communities/${communityId}/announcements`)
            .send({ title: '認証なし', content: '不可' })

        expect(res.status).toBe(401)
    })
})
