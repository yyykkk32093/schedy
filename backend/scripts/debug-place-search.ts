/**
 * Place検索デバッグスクリプト
 *
 * 用途: 投入後のヒット件数・スコア・カテゴリ分布を計測し、
 *       検索ロジック改修の効果を Before/After で比較するためのもの。
 *
 * 実行:
 *   cd backend && set -a && source env/.env.local && set +a && pnpm dlx tsx scripts/debug-place-search.ts
 */

import { PrismaClient } from '@prisma/client'

const QUERIES = ['国分寺', '文化センター', '国分寺台文化センター', 'コミュニティセンター']

type SearchRow = {
    id: string
    name: string
    address: string
    normalizedName: string
    category: string | null
    usageCount: number
    score: number
    sim: number
    prefixMatch: boolean
    containsMatch: boolean
}

function normalizeForQuery(q: string): string {
    return q
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
        .replace(/　/g, ' ')
        .toLowerCase()
        .replace(/[\s\u3000]+/g, '')
        .trim()
}

async function main(): Promise<void> {
    const prisma = new PrismaClient()
    try {
        // 全件数とカテゴリ分布
        const total = await prisma.placeMaster.count({ where: { isActive: true } })
        const byCategory = await prisma.placeMaster.groupBy({
            by: ['category'],
            where: { isActive: true },
            _count: { _all: true },
            orderBy: { _count: { id: 'desc' } },
        })
        console.log('========== 全体統計 ==========')
        console.log(`isActive=true 総件数: ${total}`)
        console.log('カテゴリ分布:')
        for (const r of byCategory) {
            console.log(`  ${r.category ?? '(null)'}: ${r._count._all}`)
        }

        // 文化センター系の名前を含むレコード件数
        const cultureCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*)::bigint AS count FROM master.place_masters WHERE "is_active"=true AND "name" LIKE '%文化センター%'`,
        )
        console.log(`\n名前に「文化センター」を含む件数: ${cultureCount[0].count}`)

        const communityCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*)::bigint AS count FROM master.place_masters WHERE "is_active"=true AND "name" LIKE '%コミュニティセンター%'`,
        )
        console.log(`名前に「コミュニティセンター」を含む件数: ${communityCount[0].count}`)

        const kokubunjiCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*)::bigint AS count FROM master.place_masters WHERE "is_active"=true AND "name" LIKE '%国分寺%'`,
        )
        console.log(`名前に「国分寺」を含む件数: ${kokubunjiCount[0].count}`)

        // クエリ毎のヒット計測
        for (const q of QUERIES) {
            const normalized = normalizeForQuery(q)
            console.log(`\n========== クエリ: "${q}" (normalized="${normalized}") ==========`)

            // 既存検索SQL再現
            const sql = `
                SELECT "id", "name", "address", "normalized_name" AS "normalizedName", "category", "usage_count" AS "usageCount",
                       similarity("normalized_name", $1) AS sim,
                       ("normalized_name" LIKE $2) AS "prefixMatch",
                       ("normalized_name" LIKE $3) AS "containsMatch",
                       (
                           similarity("normalized_name", $1) * 0.7
                           + CASE WHEN "normalized_name" LIKE $2 THEN 0.3 ELSE 0 END
                           + (LOG(10, 1 + "usage_count"::numeric)) * 0.1
                       ) AS "score"
                FROM master.place_masters
                WHERE "is_active" = TRUE
                  AND (
                        "normalized_name" LIKE $2
                     OR "normalized_name" LIKE $3
                     OR similarity("normalized_name", $1) > 0.1
                  )
                ORDER BY "score" DESC
                LIMIT 20
            `
            const rows = await prisma.$queryRawUnsafe<SearchRow[]>(
                sql,
                normalized,
                `${normalized}%`,
                `%${normalized}%`,
            )
            console.log(`  ヒット件数 (上位20まで取得): ${rows.length}`)
            for (const r of rows) {
                console.log(
                    `    score=${Number(r.score).toFixed(3)} sim=${Number(r.sim).toFixed(3)} ` +
                    `prefix=${r.prefixMatch} contains=${r.containsMatch} ` +
                    `name="${r.name}" cat=${r.category}`,
                )
            }

            // 閾値別カウント
            const thresholdRows = await prisma.$queryRawUnsafe<{ count: bigint, threshold: number }[]>(
                `
                SELECT 0.05 AS threshold, COUNT(*)::bigint AS count FROM master.place_masters
                  WHERE "is_active"=true AND similarity("normalized_name", $1) > 0.05
                UNION ALL
                SELECT 0.1, COUNT(*)::bigint FROM master.place_masters
                  WHERE "is_active"=true AND similarity("normalized_name", $1) > 0.1
                UNION ALL
                SELECT 0.2, COUNT(*)::bigint FROM master.place_masters
                  WHERE "is_active"=true AND similarity("normalized_name", $1) > 0.2
                UNION ALL
                SELECT 0.3, COUNT(*)::bigint FROM master.place_masters
                  WHERE "is_active"=true AND similarity("normalized_name", $1) > 0.3
                `,
                normalized,
            )
            console.log('  similarity 閾値別件数:')
            for (const t of thresholdRows) {
                console.log(`    > ${t.threshold}: ${t.count}`)
            }
        }
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
