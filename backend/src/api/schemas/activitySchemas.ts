/**
 * Activity / Schedule / Participation / Payment — Zod バリデーションスキーマ
 */
import { z } from 'zod/v4'

// ── Activity ──

/** POST /v1/communities/:communityId/activities */
export const createActivitySchema = z.object({
    title: z.string().min(1, 'タイトルは必須です').max(100),
    description: z.string().max(500).nullable().optional(),
    defaultLocation: z.string().max(200).nullable().optional(),
    defaultAddress: z.string().max(500).nullable().optional(),
    defaultStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm形式で入力してください').nullable().optional(),
    defaultEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm形式で入力してください').nullable().optional(),
    recurrenceRule: z.string().max(500).nullable().optional(),
    organizerUserId: z.string().uuid().nullable().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD形式で入力してください'),
    participationFee: z.number().int().min(0).max(100_000).optional(),
    visitorFee: z.number().int().min(0).max(100_000).nullable().optional(),
    isOnline: z.boolean().optional(),
    meetingUrl: z.string().url().nullable().optional(),
    capacity: z.number().int().min(1).nullable().optional(),
    shouldPostAnnouncement: z.boolean().optional(),
    allowVisitorWaitlist: z.boolean().optional(),
    recurrenceGenerationMonths: z.number().int().min(1).max(12).nullable().optional(),
})

/** PATCH /v1/activities/:id */
export const updateActivitySchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    defaultLocation: z.string().max(200).nullable().optional(),
    defaultAddress: z.string().max(500).nullable().optional(),
    defaultStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    defaultEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    recurrenceRule: z.string().max(500).nullable().optional(),
    organizerUserId: z.string().uuid().nullable().optional(),
    defaultParticipationFee: z.number().int().min(0).max(100_000).nullable().optional(),
    defaultVisitorFee: z.number().int().min(0).max(100_000).nullable().optional(),
    defaultCapacity: z.number().int().min(1).nullable().optional(),
    allowVisitorWaitlist: z.boolean().optional(),
    recurrenceGenerationMonths: z.number().int().min(1).max(12).nullable().optional(),
})

/** PATCH /v1/activities/:id/organizer */
export const changeOrganizerSchema = z.object({
    organizerUserId: z.string().uuid().nullable().optional(),
})

// ── Schedule ──

/** POST /v1/activities/:activityId/schedules */
export const createScheduleSchema = z.object({
    date: z.string().min(1, '日付は必須です'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm形式で入力してください'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm形式で入力してください'),
    location: z.string().max(200).nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
    capacity: z.number().int().min(1).nullable().optional(),
    participationFee: z.number().int().min(0).max(100_000).optional(),
    visitorFee: z.number().int().min(0).max(100_000).nullable().optional(),
    isOnline: z.boolean().optional(),
    meetingUrl: z.string().url().nullable().optional(),
})

/** PATCH /v1/schedules/:id */
export const updateScheduleSchema = z.object({
    date: z.string().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    location: z.string().max(200).nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
    capacity: z.number().int().min(1).nullable().optional(),
    participationFee: z.number().int().min(0).max(100_000).optional(),
    visitorFee: z.number().int().min(0).max(100_000).nullable().optional(),
    isOnline: z.boolean().optional(),
    meetingUrl: z.string().url().nullable().optional(),
})

// ── Participation ──

/** POST /v1/schedules/:id/participations */
export const attendScheduleSchema = z.object({
    isVisitor: z.boolean().optional(),
    paymentMethod: z.string().nullable().optional(),
})

/** POST /v1/schedules/:id/waitlist-entries */
export const joinWaitlistSchema = z.object({
    isVisitor: z.boolean().optional(),
    paymentMethod: z.string().nullable().optional(),
})

// ── Visitor ──

/** POST /v1/schedules/:id/guest-visitors */
export const addGuestVisitorSchema = z.object({
    visitorName: z.string().min(1, 'ビジター名は必須です').max(50),
    paymentMethod: z.string().nullable().optional(),
})

/** POST /v1/schedules/:id/registered-visitors */
export const addRegisteredVisitorSchema = z.object({
    visitorUserId: z.string().uuid('ユーザーIDは必須です'),
})

/** PATCH visitor payment */
export const updateVisitorPaymentSchema = z.object({
    paymentMethod: z.string().min(1),
    paymentStatus: z.string().optional(),
})

// ── Payment ──

/** PATCH /v1/schedules/:id/payments/bulk-confirm */
export const bulkConfirmPaymentsSchema = z.object({
    paymentIds: z.array(z.string().uuid()).min(1),
})

/** PATCH /v1/schedules/:id/payments/bulk */
export const bulkUpdatePaymentsSchema = z.object({
    updates: z.array(
        z.object({
            participationId: z.string().uuid(),
            paymentMethod: z.string().optional(),
            paymentStatus: z.string().optional(),
        }),
    ),
})

/** DELETE /v1/activities/:id (soft delete) */
export const deleteActivitySchema = z.object({
    cancelFutureSchedules: z.boolean().optional(),
})

/** PATCH /v1/schedules/:id/cancel-or-delete */
export const cancelOrDeleteScheduleSchema = z.object({
    operation: z.enum(['cancel', 'delete']),
    scope: z.enum(['single', 'all']),
    notifyOption: z.enum(['announcement', 'push_only', 'none']).default('push_only'),
})
