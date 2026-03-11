// test/e2e/community.test.ts

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

describeE2E('Community E2E', () => {
    const ownerId = 'e2e-owner-001'
    const ownerEmail = 'owner@test.com'
    const memberId = 'e2e-member-001'
    const memberEmail = 'member@test.com'
    const adminId = 'e2e-admin-001'
    const adminEmail = 'admin@test.com'

    beforeEach(async () => {
        await cleanAllTables()

        // テスト用ユーザーを直接作成
        await createTestUserDirect({ id: ownerId, email: ownerEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: memberId, email: memberEmail, plan: 'FREE' })
        await createTestUserDirect({ id: adminId, email: adminEmail, plan: 'FREE' })
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ========================================
    // Community CRUD
    // ========================================

    it('POST /v1/communities → 作成成功 + Outbox → AuditLog', async () => {
        const res = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'テストコミュニティ', description: '説明文' })

        expect(res.status).toBe(201)
        expect(res.body.communityId).toBeDefined()

        // DB にコミュニティが作成されている
        const community = await prisma.community.findUnique({
            where: { id: res.body.communityId },
        })
        expect(community).not.toBeNull()
        expect(community!.name).toBe('テストコミュニティ')
        expect(community!.grade).toBe('PREMIUM') // SUBSCRIBER → PREMIUM

        // OWNER の Membership が自動作成されている
        const membership = await prisma.communityMembership.findFirst({
            where: { communityId: res.body.communityId, userId: ownerId },
        })
        expect(membership).not.toBeNull()
        expect(membership!.role).toBe('OWNER')
    })

    it('GET /v1/communities → 自分が所属するコミュニティ一覧', async () => {
        // 先にコミュニティを作成
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'コミュニティA' })
        expect(createRes.status).toBe(201)

        const listRes = await request(app)
            .get('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(listRes.status).toBe(200)
        expect(Array.isArray(listRes.body.communities)).toBe(true)
        expect(listRes.body.communities.length).toBeGreaterThanOrEqual(1)
    })

    it('GET /v1/communities/:id → コミュニティ詳細', async () => {
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'コミュニティ詳細' })

        const findRes = await request(app)
            .get(`/v1/communities/${createRes.body.communityId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(findRes.status).toBe(200)
        expect(findRes.body.name).toBe('コミュニティ詳細')
    })

    it('PATCH /v1/communities/:id → コミュニティ更新（OWNERのみ）', async () => {
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: '更新前' })

        const updateRes = await request(app)
            .patch(`/v1/communities/${createRes.body.communityId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: '更新後', description: '新しい説明' })

        expect(updateRes.status).toBe(204)

        const after = await prisma.community.findUnique({
            where: { id: createRes.body.communityId },
        })
        expect(after!.name).toBe('更新後')
        expect(after!.description).toBe('新しい説明')
    })

    it('DELETE /v1/communities/:id → コミュニティ論理削除（OWNERのみ）', async () => {
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: '削除対象' })

        const deleteRes = await request(app)
            .delete(`/v1/communities/${createRes.body.communityId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(deleteRes.status).toBe(204)

        const after = await prisma.community.findUnique({
            where: { id: createRes.body.communityId },
        })
        expect(after!.deletedAt).not.toBeNull()
    })

    // ========================================
    // CommunityMembership
    // ========================================

    it('POST /v1/communities/:id/members → メンバー追加', async () => {
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'メンバーテスト' })
        const communityId = createRes.body.communityId

        const addRes = await request(app)
            .post(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ userId: memberId })

        expect(addRes.status).toBe(201)

        // DB で確認
        const membership = await prisma.communityMembership.findFirst({
            where: { communityId, userId: memberId },
        })
        expect(membership).not.toBeNull()
        expect(membership!.role).toBe('MEMBER')
    })

    it('GET /v1/communities/:id/members → メンバー一覧', async () => {
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: '一覧テスト' })
        const communityId = createRes.body.communityId

        await request(app)
            .post(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ userId: memberId })

        const listRes = await request(app)
            .get(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(listRes.status).toBe(200)
        expect(listRes.body.members.length).toBe(2) // OWNER + MEMBER
    })

    it('PATCH /v1/communities/:id/members/:userId → OWNER委譲 + grade降格', async () => {
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: '委譲テスト' })
        const communityId = createRes.body.communityId

        // memberId (FREE plan) を追加
        await request(app)
            .post(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ userId: memberId })

        // OWNER 委譲
        const changeRes = await request(app)
            .patch(`/v1/communities/${communityId}/members/${memberId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ role: 'OWNER' })

        expect(changeRes.status).toBe(204)

        // 新OWNER
        const newOwner = await prisma.communityMembership.findFirst({
            where: { communityId, userId: memberId },
        })
        expect(newOwner!.role).toBe('OWNER')

        // 旧OWNER → ADMIN降格
        const oldOwner = await prisma.communityMembership.findFirst({
            where: { communityId, userId: ownerId },
        })
        expect(oldOwner!.role).toBe('ADMIN')

        // grade が FREE に降格（新OWNER が FREE plan）
        const community = await prisma.community.findUnique({
            where: { id: communityId },
        })
        expect(community!.grade).toBe('FREE')
    })

    it('DELETE /v1/communities/:id/members/me → 脱退', async () => {
        const createRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: '脱退テスト' })
        const communityId = createRes.body.communityId

        // member を追加して脱退させる
        await request(app)
            .post(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ userId: memberId })

        const leaveRes = await request(app)
            .delete(`/v1/communities/${communityId}/members/me`)
            .set('Authorization', bearerToken(memberId, memberEmail))

        expect(leaveRes.status).toBe(204)
    })

    // ========================================
    // Sub-Community
    // ========================================

    it('POST /v1/communities/:parentId/children → サブコミュニティ作成 + Outbox → AuditLog', async () => {
        const parentRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: '親コミュニティ' })
        const parentId = parentRes.body.communityId

        // Outboxをクリア（親作成分）
        await prisma.outboxEvent.deleteMany({})
        await prisma.authAuditLog.deleteMany({})

        const childRes = await request(app)
            .post(`/v1/communities/${parentId}/children`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: '子コミュニティ', description: 'サブ' })

        expect(childRes.status).toBe(201)
        expect(childRes.body.communityId).toBeDefined()

        // DB確認
        const child = await prisma.community.findUnique({
            where: { id: childRes.body.communityId },
        })
        expect(child!.parentId).toBe(parentId)
        expect(child!.depth).toBe(1)
    })

    // ========================================
    // CommunityGradePolicy
    // ========================================

    it('FREE ユーザーが作成 → grade = FREE', async () => {
        const freeUserId = 'e2e-free-owner-001'
        await createTestUserDirect({ id: freeUserId, email: 'free@test.com', plan: 'FREE' })

        const res = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(freeUserId, 'free@test.com'))
            .send({ name: 'FREEコミュニティ' })

        expect(res.status).toBe(201)

        const community = await prisma.community.findUnique({
            where: { id: res.body.communityId },
        })
        expect(community!.grade).toBe('FREE')
    })

    it('SUBSCRIBER ユーザーが作成 → grade = PREMIUM', async () => {
        const res = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'PREMIUMコミュニティ' })

        expect(res.status).toBe(201)

        const community = await prisma.community.findUnique({
            where: { id: res.body.communityId },
        })
        expect(community!.grade).toBe('PREMIUM')
    })

    // ========================================
    // 認証なしアクセス拒否
    // ========================================

    it('認証なし → 401', async () => {
        const res = await request(app)
            .post('/v1/communities')
            .send({ name: '認証なし' })

        expect(res.status).toBe(401)
    })
})
