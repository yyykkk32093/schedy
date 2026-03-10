// test/e2e/analytics.test.ts

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

describeE2E('Analytics & Export E2E (Phase 4)', () => {
    const ownerId = 'e2e-analytics-owner'
    const ownerEmail = 'analytics-owner@test.com'
    const userAId = 'e2e-analytics-userA'
    const userAEmail = 'analytics-userA@test.com'

    let communityId: string
    let activityId: string

    beforeEach(async () => {
        await cleanAllTables()

        // PREMIUM コミュニティオーナー（SUBSCRIBER プラン）
        await createTestUserDirect({ id: ownerId, email: ownerEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: userAId, email: userAEmail, plan: 'FREE' })

        // コミュニティ作成（PREMIUM グレード）
        const comRes = await request(app)
            .post('/v1/communities')
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ name: 'Analytics テストコミュニティ' })
        communityId = comRes.body.communityId

        // コミュニティを PREMIUM にアップグレード
        await prisma.community.update({
            where: { id: communityId },
            data: { grade: 'PREMIUM' },
        })

        // Activity 作成
        const actRes = await request(app)
            .post(`/v1/communities/${communityId}/activities`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ title: 'テストアクティビティ' })
        activityId = actRes.body.activityId

        // メンバー追加
        await request(app)
            .post(`/v1/communities/${communityId}/members`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({ userId: userAId })

        // Schedule 作成
        const schedRes = await request(app)
            .post(`/v1/activities/${activityId}/schedules`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))
            .send({
                date: '2026-03-15',
                startTime: '10:00',
                endTime: '12:00',
                location: 'テスト場所',
                participationFee: 500,
            })
        const scheduleId = schedRes.body.scheduleId

        // 参加
        await request(app)
            .post(`/v1/schedules/${scheduleId}/participations`)
            .set('Authorization', bearerToken(userAId, userAEmail))
            .send({})
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ── UBL-17: コミュニティ統計 ──

    it('GET /v1/communities/:id/analytics/stats — 200 with stats', async () => {
        const res = await request(app)
            .get(`/v1/communities/${communityId}/analytics/stats`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res.status).toBe(200)
        expect(res.body.communityId).toBe(communityId)
        expect(res.body.totalActivities).toBe(1)
        expect(res.body.totalSchedules).toBeGreaterThanOrEqual(1)
        expect(res.body.byActivity).toHaveLength(1)
        expect(res.body.byActivity[0].activityTitle).toBe('テストアクティビティ')
    })

    it('GET /v1/communities/:id/analytics/stats — 403 for FREE community', async () => {
        // FREE コミュニティに戻す
        await prisma.community.update({
            where: { id: communityId },
            data: { grade: 'FREE' },
        })

        const res = await request(app)
            .get(`/v1/communities/${communityId}/analytics/stats`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res.status).toBe(403)
        expect(res.body.code).toBe('COMMUNITY_FEATURE_RESTRICTED')
    })

    // ── UBL-19: 参加者推移 ──

    it('GET /v1/communities/:id/analytics/trend — 200', async () => {
        const res = await request(app)
            .get(`/v1/communities/${communityId}/analytics/trend`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res.status).toBe(200)
        expect(res.body.communityId).toBe(communityId)
        expect(res.body.trend).toBeInstanceOf(Array)
    })

    // ── UBL-18: 欠席分析 ──

    it('GET /v1/communities/:id/analytics/absences — 200', async () => {
        const res = await request(app)
            .get(`/v1/communities/${communityId}/analytics/absences`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res.status).toBe(200)
        expect(res.body.communityId).toBe(communityId)
        expect(res.body.summary).toBeDefined()
        expect(res.body.items).toBeInstanceOf(Array)
    })

    // ── UBL-20: 参加状況 CSV ──

    it('GET /v1/communities/:id/export/participation-csv — 200 CSV download', async () => {
        const res = await request(app)
            .get(`/v1/communities/${communityId}/export/participation-csv`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toContain('text/csv')
        expect(res.headers['content-disposition']).toContain('attachment')
        // CSV should contain header row + at least one data row
        expect(res.text).toContain('アクティビティ')
    })

    // ── UBL-21: 会計情報出力（CSV） ──

    it('GET /v1/communities/:id/export/accounting?format=csv — 200', async () => {
        const res = await request(app)
            .get(`/v1/communities/${communityId}/export/accounting?format=csv`)
            .set('Authorization', bearerToken(ownerId, ownerEmail))

        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toContain('text/csv')
        expect(res.text).toContain('アクティビティ')
    })

    // ── UBL-22: カレンダーエクスポート ──

    it('GET /v1/users/me/export/calendar.ics — 200 iCal', async () => {
        const res = await request(app)
            .get('/v1/users/me/export/calendar.ics')
            .set('Authorization', bearerToken(userAId, userAEmail))

        // SUBSCRIBER プランのみ — userA は FREE なので 403
        expect(res.status).toBe(403)
    })

    it('GET /v1/users/me/export/calendar.ics — 200 for SUBSCRIBER', async () => {
        // userA を SUBSCRIBER に昇格
        await prisma.user.update({
            where: { id: userAId },
            data: { plan: 'SUBSCRIBER' },
        })

        const res = await request(app)
            .get('/v1/users/me/export/calendar.ics')
            .set('Authorization', bearerToken(userAId, userAEmail))

        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toContain('text/calendar')
        expect(res.text).toContain('BEGIN:VCALENDAR')
    })
})
