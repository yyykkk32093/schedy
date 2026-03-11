import type { PrismaClient } from '@prisma/client'

// ─── 型定義 ──────────────────────────────────────────────

export interface ExportParticipationCsvInput {
    communityId: string
    /** フィルタ: Activity ID（省略時は全 Activity） */
    activityId?: string
    /** 開始日（ISO 8601）。省略時は制限なし */
    from?: string
    /** 終了日（ISO 8601）。省略時は制限なし */
    to?: string
}

// ─── UseCase ─────────────────────────────────────────────

/**
 * ExportParticipationCsvUseCase — 参加状況 CSV 出力（UBL-20）
 */
export class ExportParticipationCsvUseCase {
    constructor(private readonly prisma: PrismaClient) { }

    async execute(input: ExportParticipationCsvInput): Promise<string> {
        const { communityId, activityId, from, to } = input

        const whereSchedule: Record<string, unknown> = {
            activity: {
                communityId,
                deletedAt: null,
                ...(activityId ? { id: activityId } : {}),
            },
        }

        if (from || to) {
            whereSchedule.date = {}
            if (from) (whereSchedule.date as Record<string, unknown>).gte = new Date(from)
            if (to) (whereSchedule.date as Record<string, unknown>).lte = new Date(to)
        }

        const participations = await this.prisma.participation.findMany({
            where: {
                schedule: whereSchedule,
            },
            select: {
                id: true,
                userId: true,
                isVisitor: true,
                respondedAt: true,
                paymentMethod: true,
                paymentStatus: true,
                schedule: {
                    select: {
                        date: true,
                        startTime: true,
                        endTime: true,
                        location: true,
                        participationFee: true,
                        activity: { select: { title: true } },
                    },
                },
            },
            orderBy: [{ schedule: { date: 'asc' } }, { respondedAt: 'asc' }],
        })

        // ユーザー名を一括取得
        const userIds = [...new Set(participations.map((p) => p.userId))]
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, displayName: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u.displayName ?? '']))

        // CSV ヘッダー（物理削除方式: 全レコード = 参加中）
        const headers = [
            'アクティビティ',
            '日付',
            '開始時間',
            '終了時間',
            '場所',
            '参加者名',
            'ビジター',
            '参加費(円)',
            '支払方法',
            '支払ステータス',
            '回答日時',
        ]

        const rows = participations.map((p) => [
            this.escapeCsv(p.schedule.activity.title),
            new Date(p.schedule.date).toISOString().slice(0, 10),
            p.schedule.startTime,
            p.schedule.endTime,
            this.escapeCsv(p.schedule.location ?? ''),
            this.escapeCsv(userMap.get(p.userId) ?? ''),
            p.isVisitor ? 'はい' : 'いいえ',
            p.schedule.participationFee?.toString() ?? '無料',
            p.paymentMethod ?? '-',
            p.paymentStatus ?? '-',
            p.respondedAt.toISOString(),
        ])

        // BOM + CSV 文字列
        const bom = '\uFEFF'
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

        return bom + csv
    }

    private escapeCsv(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`
        }
        return value
    }
}
