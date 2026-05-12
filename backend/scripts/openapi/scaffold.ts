/**
 * OpenAPI パス定義 自動生成スクリプト
 *
 * 使い方:
 *   pnpm generate:openapi:scaffold
 *
 * src/api/ 配下の *Routes.ts を全スキャンし、
 * scripts/openapi/paths/{feature}.ts を自動生成する。
 *
 * レスポンス型は scripts/openapi/response-map.ts を参照する。
 * response-map.ts が未生成の場合はヒューリスティックにフォールバック。
 *
 * 生成ファイルは pnpm generate:openapi で openapi.json に反映される。
 * 再実行すると paths/*.ts は上書きされるが response-map.ts は変更されない。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcApiDir = resolve(__dirname, '../../src/api')
const responseSchemasFile = resolve(__dirname, '../../src/api/schemas/responseSchemas.ts')
const responseMapFile = resolve(__dirname, 'response-map.ts')
const pathsDir = resolve(__dirname, 'paths')

// responseSchemas.ts から全スキーマ名を収集
const responseSchemasContent = readFileSync(responseSchemasFile, 'utf-8')
const allResponseSchemaNames = new Set(
    [...responseSchemasContent.matchAll(/^export const (\w+Schema)\b/gm)].map((m) => m[1]),
)

// ── response-map.ts を読み込む（存在する場合） ────────────────
const responseMapLookup: Record<string, string | null> = {}
if (existsSync(responseMapFile)) {
    const mapContent = readFileSync(responseMapFile, 'utf-8')
    for (const m of mapContent.matchAll(/'([A-Z]+:[^']+)':\s*(null|'([^']*)')/g)) {
        responseMapLookup[m[1]] = m[3] ?? null
    }
    console.log(`  response-map.ts 読み込み: ${Object.keys(responseMapLookup).length} エントリ`)
}

/**
 * method + path から対応するレスポンススキーマ名を推測する（フォールバック用）。
 * response-map.ts が存在する場合はそちらを優先使用する。
 */
function inferResponseSchema(method: string, openApiPath: string): string | null {
    const segments = openApiPath
        .split('/')
        .filter((s) => s && s !== 'v1' && !s.startsWith('{'))

    const toPascal = (s: string) =>
        s.replace(/-/g, '_').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')

    function toSingular(word: string): string {
        if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
        if (word.endsWith('ions')) return word.slice(0, -1)
        if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('zes')) return word.slice(0, -2)
        if (word.endsWith('s')) return word.slice(0, -1)
        return word
    }

    const last = segments[segments.length - 1] ?? ''
    const prev = segments[segments.length - 2] ?? ''

    const lastP = toPascal(last)
    const lastSingP = toPascal(toSingular(last))
    const prevP = toPascal(prev)
    const prevSingP = toPascal(toSingular(prev))
    const allP = segments.map(toPascal).join('')

    // パス末尾がパスパラメータかどうかで detail/list を判定
    const rawSegments = openApiPath.split('/').filter(Boolean)
    const isDetailEndpoint = rawSegments[rawSegments.length - 1]?.startsWith('{')

    const S = 'Schema'
    const candidates: string[] = []

    if (method === 'get') {
        if (isDetailEndpoint) {
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
            candidates.push(
                `${lastP}Response${S}`,
                `${lastP}Detail${S}`,
                `List${lastP}Response${S}`,
                `Get${lastP}Response${S}`,
                `${prevP}${lastP}Response${S}`,
                `${allP}Response${S}`,
                `${lastP}${S}`,
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
            `Create${lastP}Response${S}`,
            `Create${prevP}${lastP}Response${S}`,
            `Create${lastSingP}Response${S}`,
            `Create${prevSingP}${lastSingP}Response${S}`,
            `${lastP}Response${S}`,
            `${lastSingP}Response${S}`,
        )
    } else if (method === 'patch' || method === 'put') {
        candidates.push(
            `Update${lastP}Response${S}`,
            `Update${prevP}Response${S}`,
            `Update${lastSingP}Response${S}`,
            `Update${prevSingP}Response${S}`,
            `${lastP}Response${S}`,
            `${lastSingP}Response${S}`,
        )
    } else if (method === 'delete') {
        return null
    }

    for (const c of candidates) {
        if (allResponseSchemaNames.has(c)) return c
    }
    return null
}

// ── ルートファイル名 → フィーチャー名 ─────────────────────────
function toFeatureName(file: string): string {
    return basename(file, '.ts')
        .replace(/Routes$/, '')
        .replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`)
        .replace(/^-/, '')
}

// ── *Routes.ts 再帰収集 ───────────────────────────────────────
function findRouteFiles(dir: string): string[] {
    const results: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name)
        if (entry.isDirectory()) {
            results.push(...findRouteFiles(full))
        } else if (entry.isFile() && entry.name.endsWith('Routes.ts')) {
            results.push(full)
        }
    }
    return results
}

type Route = {
    method: string
    openApiPath: string
    hasAuth: boolean
    requestSchemaName: string | null
    responseSchemaName: string | null
}

// ── 1ファイル分のルート解析 ──────────────────────────────────
function parseRoutes(content: string): Route[] {
    const routes: Route[] = []
    for (const line of content.split('\n')) {
        const m = line.match(
            /router\.(get|post|patch|put|delete)\(\s*['"`]([^'"`]+)['"`](.*)/,
        )
        if (!m) continue

        const method = m[1]
        const rawPath = m[2]
        const rest = m[3]
        const openApiPath = rawPath.replace(/:([a-zA-Z_]\w*)/g, '{$1}')

        const hasAuth = rest.includes('authMiddleware')
        const reqSchemaMatch = rest.match(/validateBody\(\s*(\w+)\s*\)/)
        const requestSchemaName = reqSchemaMatch?.[1] ?? null

        // response-map.ts を優先、なければヒューリスティック
        const mapKey = `${method.toUpperCase()}:${openApiPath}`
        const responseSchemaName = mapKey in responseMapLookup
            ? responseMapLookup[mapKey]
            : inferResponseSchema(method, openApiPath)

        routes.push({ method, openApiPath, hasAuth, requestSchemaName, responseSchemaName })
    }
    return routes
}

// ── paths/{feature}.ts 生成 ──────────────────────────────────
function generateFileContent(feature: string, routes: Route[]): string {
    const reqSchemaNames = [...new Set(routes.flatMap((r) => (r.requestSchemaName ? [r.requestSchemaName] : [])))]
    const resSchemaNames = [...new Set(routes.flatMap((r) => (r.responseSchemaName ? [r.responseSchemaName] : [])))]

    const lines: string[] = [
        `// AUTO-GENERATED — DO NOT EDIT MANUALLY`,
        `// Run \`pnpm generate:openapi:scaffold\` to regenerate`,
        ``,
        `import { z } from 'zod/v4'`,
    ]

    if (reqSchemaNames.length > 0) {
        lines.push(`import { ${reqSchemaNames.join(', ')} } from '../../../src/api/schemas/index.js'`)
    }
    if (resSchemaNames.length > 0) {
        lines.push(`import { ${resSchemaNames.join(', ')} } from '../../../src/api/schemas/responseSchemas.js'`)
    }
    lines.push(``)

    // 同一パスの複数メソッドをまとめる
    const byPath: Record<string, Route[]> = {}
    for (const r of routes) {
        ; (byPath[r.openApiPath] ??= []).push(r)
    }

    lines.push(`export const paths: Record<string, Record<string, unknown>> = {`)

    for (const [path, pathRoutes] of Object.entries(byPath)) {
        lines.push(`  '${path}': {`)
        for (const route of pathRoutes) {
            lines.push(`    ${route.method}: {`)
            lines.push(`      tags: ['${feature}'],`)
            if (route.hasAuth) {
                lines.push(`      security: [{ bearerAuth: [] }],`)
            }
            if (route.requestSchemaName) {
                lines.push(`      requestBody: {`)
                lines.push(`        required: true,`)
                lines.push(`        content: {`)
                lines.push(`          'application/json': {`)
                lines.push(`            schema: z.toJSONSchema(${route.requestSchemaName}),`)
                lines.push(`          },`)
                lines.push(`        },`)
                lines.push(`      },`)
            }
            if (route.responseSchemaName) {
                lines.push(`      responses: {`)
                lines.push(`        200: {`)
                lines.push(`          description: 'OK',`)
                lines.push(`          content: {`)
                lines.push(`            'application/json': {`)
                lines.push(`              schema: z.toJSONSchema(${route.responseSchemaName}),`)
                lines.push(`            },`)
                lines.push(`          },`)
                lines.push(`        },`)
                lines.push(`      },`)
            } else {
                lines.push(`      responses: { 200: { description: 'OK' } },`)
            }
            lines.push(`    },`)
        }
        lines.push(`  },`)
    }

    lines.push(`}`)
    lines.push(``)

    return lines.join('\n')
}

// ── main ──────────────────────────────────────────────────────
mkdirSync(pathsDir, { recursive: true })

const routeFiles = findRouteFiles(srcApiDir)
let count = 0
let matchedCount = 0
let totalRoutes = 0

for (const file of routeFiles) {
    const content = readFileSync(file, 'utf-8')
    const routes = parseRoutes(content)
    if (routes.length === 0) continue

    const matched = routes.filter((r) => r.responseSchemaName).length
    matchedCount += matched
    totalRoutes += routes.length

    const feature = toFeatureName(file)
    const outFile = resolve(pathsDir, `${feature}.ts`)
    writeFileSync(outFile, generateFileContent(feature, routes), 'utf-8')
    console.log(`  ✓ ${feature}.ts  (${routes.length} routes, ${matched} response schemas)`)
    count++
}

console.log(`\n✅ ${count} ファイル生成完了 → scripts/openapi/paths/`)
console.log(`   レスポンススキーマ: ${matchedCount}/${totalRoutes} ルートにマッピング`)

