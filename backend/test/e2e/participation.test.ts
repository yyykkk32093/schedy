// test/e2e/participation.test.ts

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

describeE2E('Participation + Waitlist E2E', () => {
    const ownerId = 'e2e-part-owner-001'
    const ownerEmail = 'part-owner@test.com'
    const userAId = 'e2e-part-userA-001'
    const userAEmail = 'userA@test.com'
    const userBId = 'e2e-part-userB-001'
    const userBEmail = 'userB@test.com'
    const userCId = 'e2e-part-userC-001'
    const userCEmail = 'userC@test.com'

    let communityId: string
    let activityId: string

    /**
     * Schedule を作成して scheduleId を返すヘルパー
     */
    async function createSchedule(capacity: number | null = null): Promise<string> {
        const res = await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({
                date: '2026-03-15',
                startTime: '10:00',
                endTime: '12:00',
                location: 'テスト場所',
                capacity,
            })
        return res.body.scheduleId
    }

    beforeEach(async () => {
        await cleanAllTables()

        await createTestUserDirect({ id: ownerId, email: ownerEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: userAId, email: userAEmail, plan: 'FREE' })
        await createTestUserDirect({ id: userBId, email: userBEmail, plan: 'FREE' })
        await createTestUserDirect({ id: userCId, email: userCEmail, plan: 'FREE' })

        // コミュニティ + Activity
        const comRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'Participationテスト用' })
        communityId = comRes.body.communityId

        const actRes = await request(app)
            .post(`/v1/communities/${communityId}/activities`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: '参加テスト活動' })
        activityId = actRes.body.activityId

        // Outbox/Audit クリア
        await prisma.outboxEvent.deleteMany({})
        await prisma.authAuditLog.deleteMany({})
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ========================================
    // Participation（参加表明 / キャンセル）
    // ========================================

    it('POST /v1/schedules/:id/participations → 参加表明', async () => {
        const scheduleId = await createSchedule()

        const res = await request(app)
            .post(`/v1/schedules/${scheduleId}/participations`)
            .set('Authorization', bearerToken(userAId, userAEmail))
            .send({ isVisitor: false })

        expect(res.status).toBe(201)
        expect(res.body.participationId).toBeDefined()

        // DB 確認
        const participation = await prisma.participation.findFirst({
            where: { scheduleId, userId: userAId },
        })
        expect(participation).not.toBeNull()
        expect(participation!.isVisitor).toBe(false)
    })

    it('DELETE /v1/schedules/:id/participations/me → 参加キャンセル', async () => {
        const scheduleId = await createSchedule()

        // 参加
        await request(app)
            .post(`/v1/schedules/${scheduleId}/participations`)
            .set('Authorization', bearerToken(userAId, userAEmail))
            .send({ isVisitor: false })

        // キャンセル
        const res = await request(app)
            .delete(`/v1/schedules/${scheduleId}/participations/me`)
            .set('Authorization', bearerToken(userAId, userAEmail))

        expect(res.status).toBe(204)

        // DB 確認: 物理削除されていること
        const participation = await prisma.participation.findFirst({
            where: { scheduleId, userId: userAId },
        })
        expect(participation).toBeNull()

        // AuditLog にキャンセル記録が残っていること
        const auditLog = await prisma.participationAuditLog.findFirst({
            where: { scheduleId, userId: userAId, action: 'CANCELLED' },
        })
        expect(auditLog).not.toBeNull()
    })

    // ========================================
    // 定員制限 + isFull
    // ========================================

    it('定員に達した Schedule への参加 → 409', async () => {
        const scheduleId = await createSchedule(1) // 定員1

        // userA が参加（定員1/1）
        const firstRes = await request(app)
            .post(`/v1/schedules/${scheduleId}/participations`)
            .set('Authorization', bearerToken(userAId, userAEmail))
            .send({ isVisitor: false })
        expect(firstRes.status).toBe(201)

        // userB が参加試行 → 満員
        const secondRes = await request(app)
            .post(`/v1/schedules/${scheduleId}/participations`)
            .set('Authorization', bearerToken(userBId, userBEmail))
            .send({ isVisitor: false })

        expect(secondRes.status).toBe(409)
    })

    // ========================================
    // Waitlist（キャンセル待ち）
    // ========================================

    it('POST /v1/schedules/:id/waitlist-entries → キャンセル待ち登録', async () => {
        const scheduleId = await createSchedule()

        const res = await request(app)
            .post(`/v1/schedules/${scheduleId}/waitlist-entries`)
            .set('Authorization', bearerToken(userAId, userAEmail))

        expect(res.status).toBe(201)
        expect(res.body.waitlistEntryId).toBeDefined()

        // DB 確認
        const entry = await prisma.waitlistEntry.findFirst({
            where: { scheduleId, userId: userAId },
        })
        expect(entry).not.toBeNull()
    })

    it('DELETE /v1/schedules/:id/waitlist-entries/me → キャンセル待ち辞退', async () => {
        const scheduleId = await createSchedule()

        // 登録
        await request(app)
            .post(`/v1/schedules/${scheduleId}/waitlist-entries`)
            .set('Authorization', bearerToken(userAId, userAEmail))

        // 辞退
        const res = await request(app)
            .delete(`/v1/schedules/${scheduleId}/waitlist-entries/me`)
            .set('Authorization', bearerToken(userAId, userAEmail))

        expect(res.status).toBe(204)

        // DB 確認: 物理削除されていること
        const entry = await prisma.waitlistEntry.findFirst({
            where: { scheduleId, userId: userAId },
        })
        expect(entry).toBeNull()

        // AuditLog にキャンセル記録が残っていること
        const auditLog = await prisma.waitlistAuditLog.findFirst({
            where: { scheduleId, userId: userAId, action: 'CANCELLED' },
        })
        expect(auditLog).not.toBeNull()
    })

    // ========================================
    // 自動繰り上げ（定員→キャンセル→WaitlistからPromote）
    // ========================================

    it('参加キャンセル → キャンセル待ち自動繰り上げ', async () => {
        const scheduleId = await createSchedule(1) // 定員1

        // userA が参加（定員1/1）
        await request(app)
            .post(`/v1/schedules/${scheduleId}/participations`)
            .set('Authorization', bearerToken(userAId, userAEmail))
            .send({ isVisitor: false })

        // userB がキャンセル待ちに登録
        await request(app)
            .post(`/v1/schedules/${scheduleId}/waitlist-entries`)
            .set('Authorization', bearerToken(userBId, userBEmail))

        // userC もキャンセル待ちに登録
        await request(app)
            .post(`/v1/schedules/${scheduleId}/waitlist-entries`)
            .set('Authorization', bearerToken(userCId, userCEmail))

        // userA がキャンセル → 自動繰り上げ発動
        const cancelRes = await request(app)
            .delete(`/v1/schedules/${scheduleId}/participations/me`)
            .set('Authorization', bearerToken(userAId, userAEmail))
        expect(cancelRes.status).toBe(204)

        // userB の WaitlistEntry は物理削除されている（繰り上げ済み）
        const waitlistB = await prisma.waitlistEntry.findFirst({
            where: { scheduleId, userId: userBId },
        })
        expect(waitlistB).toBeNull()

        // userB の WaitlistAuditLog に PROMOTED 記録
        const wlAuditB = await prisma.waitlistAuditLog.findFirst({
            where: { scheduleId, userId: userBId, action: 'PROMOTED' },
        })
        expect(wlAuditB).not.toBeNull()

        // userB の Participation が作成されている
        const participationB = await prisma.participation.findFirst({
            where: { scheduleId, userId: userBId },
        })
        expect(participationB).not.toBeNull()

        // userC はまだ WaitlistEntry が存在
        const waitlistC = await prisma.waitlistEntry.findFirst({
            where: { scheduleId, userId: userCId },
        })
        expect(waitlistC).not.toBeNull()
    })

    // ========================================
    // ビジター参加
    // ========================================

    it('ビジター参加（isVisitor: true）', async () => {
        const scheduleId = await createSchedule()

        const res = await request(app)
            .post(`/v1/schedules/${scheduleId}/participations`)
            .set('Authorization', bearerToken(userAId, userAEmail))
            .send({ isVisitor: true })

        expect(res.status).toBe(201)

        const participation = await prisma.participation.findFirst({
            where: { scheduleId, userId: userAId },
        })
        expect(participation!.isVisitor).toBe(true)
    })

    // ========================================
    // キャンセル済みScheduleへの参加不可
    // ========================================

    it('キャンセル済みScheduleへの参加 → 409', async () => {
        const scheduleId = await createSchedule()

        // Schedule をキャンセル
        await request(app)
            .patch(`/v1/schedules/${scheduleId}/cancel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        // 参加試行
        const res = await request(app)
            .post(`/v1/schedules/${scheduleId}/participations`)
            .set('Authorization', bearerToken(userAId, userAEmail))
            .send({ isVisitor: false })

        expect(res.status).toBe(409)
    })
})
