// test/e2e/schedule.test.ts

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

describeE2E('Schedule E2E', () => {
    const ownerId = 'e2e-sch-owner-001'
    const ownerEmail = 'sch-owner@test.com'
    const memberId = 'e2e-sch-member-001'
    const memberEmail = 'sch-member@test.com'

    let communityId: string
    let activityId: string

    beforeEach(async () => {
        await cleanAllTables()

        await createTestUserDirect({ id: ownerId, email: ownerEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: memberId, email: memberEmail, plan: 'FREE' })

        // コミュニティ + Activity 作成
        const comRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'Scheduleテスト用' })
        communityId = comRes.body.communityId

        const actRes = await request(app)
            .post(`/v1/communities/${communityId}/activities`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({
                title: 'テスト活動',
                defaultLocation: 'テスト場所',
                defaultStartTime: '10:00',
                defaultEndTime: '12:00',
            })
        activityId = actRes.body.activityId

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
    // Schedule CRUD
    // ========================================

    it('POST /v1/activities/:activityId/schedules → Schedule作成', async () => {
        const res = await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({
                date: '2026-03-01',
                startTime: '10:00',
                endTime: '12:00',
                location: '○○体育館',
                note: '第1回',
                capacity: 20,
            })

        expect(res.status).toBe(201)
        expect(res.body.scheduleId).toBeDefined()

        // DB確認
        const schedule = await prisma.schedule.findUnique({
            where: { id: res.body.scheduleId },
        })
        expect(schedule).not.toBeNull()
        expect(schedule!.activityId).toBe(activityId)
        expect(schedule!.startTime).toBe('10:00')
        expect(schedule!.endTime).toBe('12:00')
        expect(schedule!.location).toBe('○○体育館')
        expect(schedule!.capacity).toBe(20)
        expect(schedule!.status).toBe('SCHEDULED')
    })

    it('GET /v1/activities/:activityId/schedules → Schedule一覧', async () => {
        await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ date: '2026-03-01', startTime: '10:00', endTime: '12:00' })
        await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ date: '2026-03-08', startTime: '10:00', endTime: '12:00' })

        const listRes = await request(app)
            .get(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(listRes.status).toBe(200)
        expect(Array.isArray(listRes.body.schedules)).toBe(true)
        expect(listRes.body.schedules.length).toBe(2)
    })

    it('GET /v1/schedules/:id → Schedule詳細', async () => {
        const createRes = await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ date: '2026-03-01', startTime: '10:00', endTime: '12:00', note: '詳細テスト' })

        const findRes = await request(app)
            .get(`/v1/schedules/${createRes.body.scheduleId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(findRes.status).toBe(200)
        expect(findRes.body.note).toBe('詳細テスト')
    })

    it('PATCH /v1/schedules/:id → Schedule更新', async () => {
        const createRes = await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ date: '2026-03-01', startTime: '10:00', endTime: '12:00' })

        const updateRes = await request(app)
            .patch(`/v1/schedules/${createRes.body.scheduleId}`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ location: '新しい場所', capacity: 15 })

        expect(updateRes.status).toBe(204)

        const after = await prisma.schedule.findUnique({
            where: { id: createRes.body.scheduleId },
        })
        expect(after!.location).toBe('新しい場所')
        expect(after!.capacity).toBe(15)
    })

    it('PATCH /v1/schedules/:id/cancel → Scheduleキャンセル', async () => {
        const createRes = await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ date: '2026-03-01', startTime: '10:00', endTime: '12:00' })

        const cancelRes = await request(app)
            .patch(`/v1/schedules/${createRes.body.scheduleId}/cancel`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(cancelRes.status).toBe(204)

        const after = await prisma.schedule.findUnique({
            where: { id: createRes.body.scheduleId },
        })
        expect(after!.status).toBe('CANCELLED')
    })

    // ========================================
    // 権限チェック
    // ========================================

    it('一般メンバーはSchedule作成不可 → 403', async () => {
        const res = await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(memberId, memberEmail))
            .send({ date: '2026-03-01', startTime: '10:00', endTime: '12:00' })

        expect(res.status).toBe(403)
    })
})
