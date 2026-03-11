import type { PrismaClient } from '@prisma/client'

// ─── 型定義 ──────────────────────────────────────────────

export interface ExportCalendarInput {
    userId: string
    /** 開始日（ISO 8601）。省略時は今日 */
    from?: string
    /** 終了日（ISO 8601）。省略時は3か月後 */
    to?: string
}

// ─── UseCase ─────────────────────────────────────────────

/**
 * ExportCalendarUseCase — iCal エクスポート（UBL-22）
 */
export class ExportCalendarUseCase {
    constructor(private readonly prisma: PrismaClient) { }

    async execute(input: ExportCalendarInput): Promise<string> {
        const { userId } = input
        const now = new Date()
        const fromDate = input.from ? new Date(input.from) : now
        const toDate = input.to
            ? new Date(input.to)
            : new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())

        // ユーザーが参加中のスケジュールを取得
        const participations = await this.prisma.participation.findMany({
            where: {
                userId,
                schedule: {
                    date: { gte: fromDate, lte: toDate },
                    status: 'SCHEDULED',
                },
            },
            select: {
                schedule: {
                    select: {
                        id: true,
                        date: true,
                        startTime: true,
                        endTime: true,
                        location: true,
                        note: true,
                        activity: {
                            select: {
                                title: true,
                                community: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { schedule: { date: 'asc' } },
        })

        // 動的 import（ESM 対応）
        const { ICalCalendar, ICalCalendarMethod } = await import('ical-generator')

        const calendar = new ICalCalendar({
            name: 'Schedy スケジュール',
            prodId: { company: 'schedy', product: 'calendar-export' },
            method: ICalCalendarMethod.PUBLISH,
        })

        for (const { schedule } of participations) {
            const dateStr = new Date(schedule.date).toISOString().slice(0, 10)
            const start = new Date(`${dateStr}T${schedule.startTime}:00`)
            const end = new Date(`${dateStr}T${schedule.endTime}:00`)
            const title = `${schedule.activity.title} — ${schedule.activity.community.name}`

            calendar.createEvent({
                id: schedule.id,
                start,
                end,
                summary: title,
                location: schedule.location ?? undefined,
                description: schedule.note ?? undefined,
            })
        }

        return calendar.toString()
    }
}
