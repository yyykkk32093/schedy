import type { PrismaClient } from '@prisma/client'

// ─── 型定義 ──────────────────────────────────────────────

export interface ExportAccountingInput {
    communityId: string
    /** 開始日（ISO 8601） */
    from?: string
    /** 終了日（ISO 8601） */
    to?: string
    /** 出力フォーマット */
    format: 'csv' | 'pdf'
}

export interface AccountingRow {
    activityTitle: string
    scheduleDate: string
    participationFee: number
    attendingCount: number
    paidCount: number
    unpaidCount: number
    totalRevenue: number
}

export interface ExportAccountingOutput {
    format: 'csv' | 'pdf'
    data: Buffer | string
    filename: string
}

// ─── UseCase ─────────────────────────────────────────────

/**
 * ExportAccountingUseCase — 会計情報出力（UBL-21）
 */
export class ExportAccountingUseCase {
    constructor(private readonly prisma: PrismaClient) { }

    async execute(input: ExportAccountingInput): Promise<ExportAccountingOutput> {
        const { communityId, format } = input

        const whereSchedule: Record<string, unknown> = {
            activity: { communityId, deletedAt: null },
        }
        if (input.from || input.to) {
            whereSchedule.date = {}
            if (input.from)
                (whereSchedule.date as Record<string, unknown>).gte = new Date(input.from)
            if (input.to)
                (whereSchedule.date as Record<string, unknown>).lte = new Date(input.to)
        }

        const schedules = await this.prisma.schedule.findMany({
            where: whereSchedule,
            select: {
                id: true,
                date: true,
                participationFee: true,
                activity: { select: { title: true } },
                participations: {
                    select: {
                        status: true,
                        paymentStatus: true,
                    },
                },
            },
            orderBy: { date: 'asc' },
        })

        const rows: AccountingRow[] = schedules.map((s) => {
            const fee = s.participationFee ?? 0
            const attending = s.participations.filter(
                (p) => p.status === 'ATTENDING',
            )
            const paidCount = attending.filter(
                (p) => p.paymentStatus === 'CONFIRMED',
            ).length
            const unpaidCount = attending.length - paidCount

            return {
                activityTitle: s.activity.title,
                scheduleDate: new Date(s.date).toISOString().slice(0, 10),
                participationFee: fee,
                attendingCount: attending.length,
                paidCount,
                unpaidCount,
                totalRevenue: fee * paidCount,
            }
        })

        if (format === 'csv') {
            return {
                format: 'csv',
                data: this.toCsv(rows),
                filename: `accounting_${communityId}_${new Date().toISOString().slice(0, 10)}.csv`,
            }
        }

        // PDF
        return {
            format: 'pdf',
            data: await this.toPdf(rows, communityId),
            filename: `accounting_${communityId}_${new Date().toISOString().slice(0, 10)}.pdf`,
        }
    }

    private toCsv(rows: AccountingRow[]): string {
        const headers = [
            'アクティビティ',
            '日付',
            '参加費(円)',
            '参加者数',
            '支払済',
            '未払い',
            '売上(円)',
        ]

        const csvRows = rows.map((r) =>
            [
                this.escapeCsv(r.activityTitle),
                r.scheduleDate,
                r.participationFee,
                r.attendingCount,
                r.paidCount,
                r.unpaidCount,
                r.totalRevenue,
            ].join(','),
        )

        // 合計行
        const totalRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0)
        const totalAttending = rows.reduce((s, r) => s + r.attendingCount, 0)
        const totalPaid = rows.reduce((s, r) => s + r.paidCount, 0)
        const totalUnpaid = rows.reduce((s, r) => s + r.unpaidCount, 0)
        csvRows.push(
            ['合計', '', '', totalAttending, totalPaid, totalUnpaid, totalRevenue].join(','),
        )

        const bom = '\uFEFF'
        return bom + [headers.join(','), ...csvRows].join('\n')
    }

    private async toPdf(rows: AccountingRow[], communityId: string): Promise<Buffer> {
        // 動的 import（ESM 対応）
        const PDFDocument = (await import('pdfkit')).default

        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 40 })
            const chunks: Buffer[] = []

            doc.on('data', (chunk: Buffer) => chunks.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', reject)

            // ヘッダー
            doc.fontSize(16).text(`会計レポート — ${communityId}`, { align: 'center' })
            doc.moveDown()
            doc.fontSize(10).text(`出力日: ${new Date().toISOString().slice(0, 10)}`)
            doc.moveDown()

            // テーブルヘッダー
            const colWidths = [130, 70, 60, 55, 55, 55, 70]
            const headers = [
                'アクティビティ',
                '日付',
                '参加費',
                '参加者',
                '支払済',
                '未払い',
                '売上',
            ]
            let x = 40
            doc.fontSize(9).font('Helvetica-Bold')
            for (let i = 0; i < headers.length; i++) {
                doc.text(headers[i], x, doc.y, {
                    width: colWidths[i],
                    continued: i < headers.length - 1,
                })
                x += colWidths[i]
            }
            doc.moveDown(0.5)
            doc.font('Helvetica')

            // テーブル行
            for (const row of rows) {
                x = 40
                const y = doc.y
                const values = [
                    row.activityTitle,
                    row.scheduleDate,
                    `¥${row.participationFee}`,
                    row.attendingCount.toString(),
                    row.paidCount.toString(),
                    row.unpaidCount.toString(),
                    `¥${row.totalRevenue}`,
                ]
                for (let i = 0; i < values.length; i++) {
                    doc.text(values[i], x, y, {
                        width: colWidths[i],
                        continued: i < values.length - 1,
                    })
                    x += colWidths[i]
                }
                doc.moveDown(0.3)
            }

            // 合計
            doc.moveDown()
            const totalRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0)
            doc.font('Helvetica-Bold').text(`合計売上: ¥${totalRevenue.toLocaleString()}`)

            doc.end()
        })
    }

    private escapeCsv(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`
        }
        return value
    }
}
