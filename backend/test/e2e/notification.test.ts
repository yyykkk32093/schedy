// test/e2e/notification.test.ts

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

describeE2E('Notification E2E', () => {
    const userId = 'e2e-notif-user-001'
    const userEmail = 'notif-user@test.com'
    const otherUserId = 'e2e-notif-other-001'
    const otherUserEmail = 'notif-other@test.com'

    beforeEach(async () => {
        await cleanAllTables()

        await createTestUserDirect({ id: userId, email: userEmail, plan: 'SUBSCRIBER' })
        await createTestUserDirect({ id: otherUserId, email: otherUserEmail, plan: 'FREE' })

        // テスト用通知をDBに直接作成
        await prisma.notification.createMany({
            data: [
                {
                    userId,
                    type: 'MENTION',
                    title: '通知1',
                    body: 'メンションされました',
                    referenceId: 'msg-001',
                    referenceType: 'MESSAGE',
                    isRead: false,
                },
                {
                    userId,
                    type: 'DM',
                    title: '通知2',
                    body: 'DMが届きました',
                    referenceId: 'dm-001',
                    referenceType: 'DM_CHANNEL',
                    isRead: false,
                },
                {
                    userId,
                    type: 'ANNOUNCEMENT',
                    title: '通知3（既読）',
                    body: 'お知らせ',
                    isRead: true,
                },
                {
                    userId: otherUserId,
                    type: 'MENTION',
                    title: '他ユーザーの通知',
                    body: '別の通知',
                    isRead: false,
                },
            ],
        })

        await prisma.outboxEvent.deleteMany({})
        await prisma.authAuditLog.deleteMany({})
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ========================================
    // 通知一覧
    // ========================================

    it('GET /v1/notifications → 自分の通知一覧', async () => {
        const res = await request(app)
            .get('/v1/notifications')
            .set('Authorization', bearerToken(userId, userEmail))

        expect(res.status).toBe(200)
        expect(res.body.notifications.length).toBe(3)
        // 自分の通知のみ（他ユーザーの通知は含まれない）
        const titles = res.body.notifications.map((n: any) => n.title)
        expect(titles).toContain('通知1')
        expect(titles).toContain('通知2')
        expect(titles).toContain('通知3（既読）')
    })

    it('GET /v1/notifications → 他ユーザーの通知は見えない', async () => {
        const res = await request(app)
            .get('/v1/notifications')
            .set('Authorization', bearerToken(otherUserId, otherUserEmail))

        expect(res.status).toBe(200)
        expect(res.body.notifications.length).toBe(1)
        expect(res.body.notifications[0].title).toBe('他ユーザーの通知')
    })

    // ========================================
    // 未読数
    // ========================================

    it('GET /v1/notifications/unread-count → 未読通知数', async () => {
        const res = await request(app)
            .get('/v1/notifications/unread-count')
            .set('Authorization', bearerToken(userId, userEmail))

        expect(res.status).toBe(200)
        expect(res.body.count).toBe(2) // 通知1, 通知2
    })

    // ========================================
    // 既読
    // ========================================

    it('PATCH /v1/notifications/:id/read → 通知を既読にする', async () => {
        const listRes = await request(app)
            .get('/v1/notifications')
            .set('Authorization', bearerToken(userId, userEmail))

        const unreadNotif = listRes.body.notifications.find((n: any) => !n.isRead)

        const res = await request(app)
            .patch(`/v1/notifications/${unreadNotif.id}/read`)
            .set('Authorization', bearerToken(userId, userEmail))

        expect(res.status).toBe(200)
        expect(res.body.isRead).toBe(true)

        // 未読数が減ったことを確認
        const countRes = await request(app)
            .get('/v1/notifications/unread-count')
            .set('Authorization', bearerToken(userId, userEmail))

        expect(countRes.body.count).toBe(1)
    })

    it('PATCH /v1/notifications/:id/read → 他ユーザーの通知は既読にできない', async () => {
        const listRes = await request(app)
            .get('/v1/notifications')
            .set('Authorization', bearerToken(otherUserId, otherUserEmail))

        const notifId = listRes.body.notifications[0].id

        const res = await request(app)
            .patch(`/v1/notifications/${notifId}/read`)
            .set('Authorization', bearerToken(userId, userEmail))

        expect(res.status).toBe(404)
    })

    // ========================================
    // すべて既読
    // ========================================

    it('PATCH /v1/notifications/read-all → すべて既読', async () => {
        const res = await request(app)
            .patch('/v1/notifications/read-all')
            .set('Authorization', bearerToken(userId, userEmail))

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)

        // 未読数が0になったことを確認
        const countRes = await request(app)
            .get('/v1/notifications/unread-count')
            .set('Authorization', bearerToken(userId, userEmail))

        expect(countRes.body.count).toBe(0)
    })
})
