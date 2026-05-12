/**
 * ルート → レスポンス型 マッピング生成スクリプト
 *
 * 使い方:
 *   pnpm generate:response-map
 *
 * 出力: scripts/openapi/response-map.ts
 *
 * - すでに response-map.ts が存在する場合、未登録ルートのみ追記する（既存マッピングを保持）
 * - scaffold.ts はこのファイルを参照してレスポンス型を解決する
 * - null が残っている箇所は手動で responseSchemas.ts の型名を埋めてください
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcApiDir = resolve(__dirname, '../../src/api')
const responseSchemasFile = resolve(__dirname, '../../src/api/schemas/responseSchemas.ts')
const outputFile = resolve(__dirname, 'response-map.ts')

// 全レスポンス「スキーマ名」を収集（例: ListParticipantsResponseSchema）
const responseSchemasContent = readFileSync(responseSchemasFile, 'utf-8')
const allSchemaNames = new Set(
    [...responseSchemasContent.matchAll(/^export const (\w+Schema)\b/gm)].map((m) => m[1]),
)

// ── ヒューリスティック（最大限マッチを広げる） ──────────────
function inferResponseSchema(method: string, rawPath: string): string | null {
    const segments = rawPath
        .split('/')
        .filter((s) => s && s !== 'v1' && !s.startsWith(':'))

    const toPascal = (s: string) =>
        s.replace(/-/g, '_').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')

    // 単数形変換: participations → Participation, entries → Entry, etc.
    function toSingular(word: string): string {
        if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
        if (word.endsWith('ions')) return word.slice(0, -1)  // participations → participation
        if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('zes')) return word.slice(0, -2)
        if (word.endsWith('s')) return word.slice(0, -1)
        return word
    }

    const last = segments[segments.length - 1] ?? ''
    const prev = segments[segments.length - 2] ?? ''
    const allSeg = segments.map(toPascal).join('')

    const lastP = toPascal(last)
    const lastSingP = toPascal(toSingular(last))
    const prevP = toPascal(prev)
    const prevSingP = toPascal(toSingular(prev))

    // パスの末尾がパスパラメータ({id}等)かどうかで detail/list を判定
    const rawSegments = rawPath.split('/').filter(Boolean)
    const isDetailEndpoint = rawSegments[rawSegments.length - 1]?.startsWith(':')

    const S = 'Schema'
    const candidates: string[] = []

    if (method === 'get') {
        if (isDetailEndpoint) {
            // 末尾が :id → detail系を優先、List系を排除
            candidates.push(
                `${lastSingP}Detail${S}`,
                `${lastSingP}Response${S}`,
                `Get${lastSingP}Response${S}`,
                `${lastP}Detail${S}`,
                `${lastP}Response${S}`,
                `${prevSingP}Detail${S}`,
                `${prevSingP}Response${S}`,
                `${prevP}Detail${S}`,
                `${prevP}Response${S}`,
            )
        } else {
            // 末尾が通常セグメント → list系を優先
            candidates.push(
                `${lastP}Response${S}`,
                `${lastP}Detail${S}`,
                `List${lastP}Response${S}`,
                `Get${lastP}Response${S}`,
                `${prevP}${lastP}Response${S}`,
                `${allSeg}Response${S}`,
                `${lastP}${S}`,
                // singular
                `List${lastSingP}sResponse${S}`,
                `List${lastSingP}Response${S}`,
                `${lastSingP}Detail${S}`,
                `${lastSingP}Response${S}`,
                `Get${lastSingP}Response${S}`,
                `${prevP}${lastSingP}Response${S}`,
                `${prevSingP}${lastSingP}Response${S}`,
            )
        }
    } else if (method === 'post') {
        candidates.push(
            `Create${lastP}Response${S}`, `Create${prevP}${lastP}Response${S}`,
            `Create${lastSingP}Response${S}`, `Create${prevSingP}${lastSingP}Response${S}`,
            `${lastP}Response${S}`, `${lastSingP}Response${S}`,
        )
    } else if (method === 'patch' || method === 'put') {
        candidates.push(
            `Update${lastP}Response${S}`, `Update${prevP}Response${S}`,
            `Update${lastSingP}Response${S}`, `Update${prevSingP}Response${S}`,
            `${lastP}Response${S}`, `${lastSingP}Response${S}`,
        )
    } else {
        return null
    }

    for (const c of candidates) {
        if (allSchemaNames.has(c)) return c
    }

    return null
}

// ── ルートファイル収集 ────────────────────────────────────────
function findRouteFiles(dir: string): string[] {
    const results: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name)
        if (entry.isDirectory()) results.push(...findRouteFiles(full))
        else if (entry.isFile() && entry.name.endsWith('Routes.ts')) results.push(full)
    }
    return results
}

function toRouteKey(method: string, openApiPath: string): string {
    return `${method.toUpperCase()}:${openApiPath}`
}

// ── 既存マッピングを読み込む ──────────────────────────────────
const existingMap: Record<string, string | null> = {}
if (existsSync(outputFile)) {
    const existing = readFileSync(outputFile, 'utf-8')
    for (const m of existing.matchAll(/'([A-Z]+:[^']+)':\s*(null|'([^']*)')/g)) {
        existingMap[m[1]] = m[3] ?? null  // m[3] is the string value, undefined if null
    }
    console.log(`  既存マッピング: ${Object.keys(existingMap).length} エントリ読み込み`)
}

// ── 全ルート収集 ──────────────────────────────────────────────
const allRoutes: Array<{ key: string; method: string; path: string; inferred: string | null }> = []

for (const file of findRouteFiles(srcApiDir)) {
    const content = readFileSync(file, 'utf-8')
    for (const line of content.split('\n')) {
        const m = line.match(/router\.(get|post|patch|put|delete)\(\s*['"`]([^'"`]+)['"`]/)
        if (!m) continue
        const method = m[1]
        const rawPath = m[2]
        const openApiPath = rawPath.replace(/:([a-zA-Z_]\w*)/g, '{$1}')
        const key = toRouteKey(method, openApiPath)
        if (!allRoutes.find((r) => r.key === key)) {
            allRoutes.push({ key, method, path: openApiPath, inferred: inferResponseSchema(method, rawPath) })
        }
    }
}

// ── マッピングをマージ（既存を優先） ─────────────────────────
const mergedMap: Record<string, string | null> = {}
let newCount = 0
let autoMapped = 0

for (const route of allRoutes) {
    if (route.key in existingMap) {
        mergedMap[route.key] = existingMap[route.key]
    } else {
        mergedMap[route.key] = route.inferred
        newCount++
        if (route.inferred) autoMapped++
    }
}

const totalMapped = Object.values(mergedMap).filter(Boolean).length
const totalNull = Object.values(mergedMap).filter((v) => v === null).length

// ── ファイル生成 ──────────────────────────────────────────────
const lines: string[] = [
    `/**`,
    ` * ルート → レスポンス型 マッピング`,
    ` * AUTO-GENERATED by: pnpm generate:response-map`,
    ` *`,
    ` * null の箇所は responseSchemas.ts の型名を手動で記載してください。`,
    ` * DELETE メソッドはレスポンスボディなしのため null のままで正常です。`,
    ` * このファイルを再生成しても手動記入した値は保持されます。`,
    ` */`,
    ``,
    `export const responseMap: Record<string, string | null> = {`,
]

// method でグループ化して見やすくする
const byMethod: Record<string, string[]> = {}
for (const [key, typeName] of Object.entries(mergedMap)) {
    const method = key.split(':')[0]
    byMethod[method] ??= []
    const value = typeName ? `'${typeName}'` : 'null'
    byMethod[method].push(`  '${key}': ${value},`)
}

for (const method of ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']) {
    if (byMethod[method]?.length) {
        lines.push(`  // ── ${method} ──`)
        lines.push(...byMethod[method])
    }
}

lines.push(`}`)
lines.push(``)

writeFileSync(outputFile, lines.join('\n'), 'utf-8')

console.log(`\n✅ 生成完了: ${outputFile}`)
console.log(`   全ルート: ${allRoutes.length}`)
console.log(`   マッピング済み: ${totalMapped} (新規自動: ${autoMapped})`)
console.log(`   null（手動記入が必要）: ${totalNull}`)
if (newCount > 0) console.log(`   新規ルート追加: ${newCount}`)
