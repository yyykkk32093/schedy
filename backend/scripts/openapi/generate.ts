/**
 * OpenAPI ドキュメント 全自動生成スクリプト（統合版）
 *
 * 使い方:
 *   pnpm generate:openapi
 *
 * 処理フロー:
 *   1. frontend/src/features/**\/*Api.ts の http<Type>(url,{method}) を解析
 *      → URL・メソッド・レスポンス型の対応表を自動構築（手動入力不要）
 *   2. backend/src/api/**\/*Routes.ts をスキャンして paths/*.ts を生成
 *   3. paths/*.ts を収集して docs/openapi.json を出力
 *
 * 出力: backend/docs/openapi.json
 * VS Code の "Swagger Viewer" 拡張で Shift+Option+P でプレビュー。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendFeaturesDir = resolve(__dirname, '../../../frontend/src/features')
const srcApiDir = resolve(__dirname, '../../src/api')
const responseSchemasFile = resolve(__dirname, '../../src/api/schemas/responseSchemas.ts')
const pathsDir = resolve(__dirname, 'paths')
const outDir = resolve(__dirname, '../../docs')
const outFile = resolve(outDir, 'openapi.json')

// ══════════════════════════════════════════════════════════════
// STEP 1: responseSchemas.ts から利用可能なスキーマ名を収集
// ══════════════════════════════════════════════════════════════
const responseSchemasContent = readFileSync(responseSchemasFile, 'utf-8')
const allSchemaNames = new Set(
    [...responseSchemasContent.matchAll(/^export const (\w+Schema)\b/gm)].map((m) => m[1]),
)
console.log(`[1/3] responseSchemas.ts から ${allSchemaNames.size} スキーマ名を読み込み`)

// ══════════════════════════════════════════════════════════════
// STEP 2: frontend *Api.ts をパースして URL→スキーマ名マップを構築
// ══════════════════════════════════════════════════════════════

function findFrontendApiFiles(dir: string): string[] {
    const results: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name)
        if (entry.isDirectory()) results.push(...findFrontendApiFiles(full))
        else if (entry.isFile() && entry.name.endsWith('Api.ts')) results.push(full)
    }
    return results
}

/**
 * パスパラメータを正規化（異なる変数名でも同一パスとして照合するため）
 * /v1/schedules/{id}/...    (バックエンド)
 * /v1/schedules/${scheduleId}/... (フロントエンド)
 * → どちらも /v1/schedules/{p}/... として一致
 */
function normalizePath(url: string): string {
    return url
        .replace(/\$\{[^}]+\}/g, '{p}')
        .replace(/\{[^}]+\}/g, '{p}')
}

function buildResponseMapFromFrontend(): Record<string, string | null> {
    const map: Record<string, string | null> = {}
    const apiFiles = findFrontendApiFiles(frontendFeaturesDir)

    /**
     * テンプレートリテラルの URL を正確に抽出する。
     * - `${simpleVar}` → そのまま保持（パスパラメータ）
     * - `${expr ? ...}` などの複雑な式 → 除外（クエリストリング等）
     * - ネストした `...` を正しくスキップする。
     */
    function extractTemplateLiteralUrl(content: string, start: number): { url: string; end: number } {
        let i = start + 1 // opening ` をスキップ
        let url = ''
        while (i < content.length) {
            const ch = content[i]
            if (ch === '\\') { url += content[i + 1]; i += 2; continue }
            if (ch === '`') return { url, end: i + 1 }
            if (ch === '$' && content[i + 1] === '{') {
                i += 2 // ${ をスキップ
                let depth = 1
                let expr = ''
                while (i < content.length && depth > 0) {
                    const ec = content[i]
                    if (ec === '{') depth++
                    else if (ec === '}') { depth--; if (depth === 0) break }
                    else if (ec === '`') {
                        // ネストしたテンプレートリテラルをスキップ
                        i++
                        let nd = 1
                        while (i < content.length && nd > 0) {
                            if (content[i] === '`') nd--
                            i++
                        }
                        continue
                    } else {
                        expr += ec
                    }
                    i++
                }
                i++ // 閉じ } をスキップ
                // 単純な識別子のみパスパラメータとして保持
                if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(expr.trim())) {
                    url += '${' + expr.trim() + '}'
                }
                // 複雑な式（クエリストリング等）は無視
                continue
            }
            url += ch
            i++
        }
        return { url, end: i + 1 }
    }

    for (const file of apiFiles) {
        const content = readFileSync(file, 'utf-8')
        let pos = 0

        while (true) {
            const httpIdx = content.indexOf('http<', pos)
            if (httpIdx === -1) break
            pos = httpIdx + 5

            // generic 型引数を抽出（<...> の深さを追跡）
            let depth = 1
            let typeEnd = pos
            while (typeEnd < content.length && depth > 0) {
                if (content[typeEnd] === '<') depth++
                else if (content[typeEnd] === '>') depth--
                typeEnd++
            }
            const typeName = content.slice(pos, typeEnd - 1).trim()
            pos = typeEnd

            // 空白をスキップして ( を確認
            let argStart = pos
            while (argStart < content.length && /\s/.test(content[argStart])) argStart++
            if (content[argStart] !== '(') continue
            argStart++
            while (argStart < content.length && /\s/.test(content[argStart])) argStart++

            // URL を抽出
            let url: string | null = null
            const quote = content[argStart]
            if (quote === '`') {
                // テンプレートリテラル：ネスト処理付きで抽出
                const result = extractTemplateLiteralUrl(content, argStart)
                url = result.url
                pos = result.end
            } else if (quote === "'" || quote === '"') {
                const urlEnd = content.indexOf(quote, argStart + 1)
                if (urlEnd === -1) continue
                url = content.slice(argStart + 1, urlEnd)
                pos = urlEnd + 1
            } else {
                continue
            }

            if (!url.startsWith('/v1/')) continue

            // OpenAPI パス形式に変換: ${varName} → {varName}
            const openApiUrl = url.replace(/\$\{([^}]+)\}/g, '{$1}')
            const normalizedUrl = normalizePath(openApiUrl)

            // ── http() の閉じカッコまでをスキャンしてメソッドを抽出 ──
            // pos は URL の閉じクォートの直後。http( の中にいるので depth=1 から開始。
            let argDepth = 1
            let callEnd = pos
            while (callEnd < content.length && argDepth > 0) {
                const ch = content[callEnd]
                if (ch === '(') argDepth++
                else if (ch === ')') argDepth--
                else if (ch === '`') {
                    // テンプレートリテラルをスキップ
                    callEnd++
                    while (callEnd < content.length && content[callEnd] !== '`') {
                        if (content[callEnd] === '\\') callEnd++
                        callEnd++
                    }
                } else if (ch === '"' || ch === "'") {
                    const q = ch; callEnd++
                    while (callEnd < content.length && content[callEnd] !== q) {
                        if (content[callEnd] === '\\') callEnd++
                        callEnd++
                    }
                }
                callEnd++
            }
            const callBody = content.slice(pos, callEnd)
            const methodMatch = callBody.match(/method:\s*['"]([A-Z]+)['"]/i)
            const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET'

            // スキーマ名を解決（TypeName → TypeNameSchema）
            let schemaName: string | null = null
            if (typeName !== 'void' && !typeName.startsWith('{') && /^\w+$/.test(typeName)) {
                const candidate = `${typeName}Schema`
                if (allSchemaNames.has(candidate)) schemaName = candidate
            }

            const key = `${method}:${normalizedUrl}`
            if (!(key in map)) map[key] = schemaName
        }
    }

    return map
}

const responseMap = buildResponseMapFromFrontend()
const frontendFileCount = findFrontendApiFiles(frontendFeaturesDir).length
const mappedCount = Object.values(responseMap).filter(Boolean).length
console.log(`[2/3] frontend ${frontendFileCount} ファイルから ${Object.keys(responseMap).length} ルートを解析 (スキーマ解決済み: ${mappedCount})`)

// ══════════════════════════════════════════════════════════════
// STEP 3: backend *Routes.ts から paths/*.ts を生成
// ══════════════════════════════════════════════════════════════

/** ヒューリスティックフォールバック（フロントエンドに定義がない admin/webhook 等） */
function inferResponseSchemaFallback(method: string, openApiPath: string): string | null {
    const segments = openApiPath.split('/').filter((s) => s && s !== 'v1' && !s.startsWith('{'))
    if (segments.length === 0) return null

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
    const rawSegments = openApiPath.split('/').filter(Boolean)
    const isDetail = rawSegments[rawSegments.length - 1]?.startsWith('{')
    const S = 'Schema'
    const candidates: string[] = []

    if (method === 'get') {
        if (isDetail) {
            candidates.push(
                `${lastSingP}Detail${S}`, `${lastSingP}Response${S}`, `Get${lastSingP}Response${S}`,
                `${lastP}Detail${S}`, `${lastP}Response${S}`,
                `${prevSingP}Detail${S}`, `${prevSingP}Response${S}`, `${prevP}Detail${S}`, `${prevP}Response${S}`,
            )
        } else {
            candidates.push(
                `${lastP}Response${S}`, `${lastP}Detail${S}`, `List${lastP}Response${S}`,
                `Get${lastP}Response${S}`, `${prevP}${lastP}Response${S}`, `${allP}Response${S}`,
                `${lastP}${S}`, `List${lastSingP}sResponse${S}`, `List${lastSingP}Response${S}`,
                `${lastSingP}Detail${S}`, `${lastSingP}Response${S}`, `Get${lastSingP}Response${S}`,
                `${prevP}${lastSingP}Response${S}`, `${prevSingP}${lastSingP}Response${S}`,
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
    }

    for (const c of candidates) {
        if (allSchemaNames.has(c)) return c
    }
    return null
}

type Route = {
    method: string
    openApiPath: string
    hasAuth: boolean
    requestSchemaName: string | null
    responseSchemaName: string | null
}

function resolveResponseSchema(method: string, openApiPath: string): string | null {
    const key = `${method.toUpperCase()}:${normalizePath(openApiPath)}`
    if (key in responseMap) return responseMap[key]
    return inferResponseSchemaFallback(method, openApiPath)
}

function parseRoutes(content: string): Route[] {
    const routes: Route[] = []
    for (const line of content.split('\n')) {
        const m = line.match(/router\.(get|post|patch|put|delete)\(\s*['"`]([^'"`]+)['"`](.*)/)
        if (!m) continue
        const method = m[1]
        const rawPath = m[2]
        const rest = m[3]
        const openApiPath = rawPath.replace(/:([a-zA-Z_]\w*)/g, '{$1}')
        const hasAuth = rest.includes('authMiddleware')
        const reqSchemaMatch = rest.match(/validateBody\(\s*(\w+)\s*\)/)
        const requestSchemaName = reqSchemaMatch?.[1] ?? null
        const responseSchemaName = resolveResponseSchema(method, openApiPath)
        routes.push({ method, openApiPath, hasAuth, requestSchemaName, responseSchemaName })
    }
    return routes
}

function generatePathsFileContent(feature: string, routes: Route[]): string {
    const reqSchemaNames = [...new Set(routes.flatMap((r) => r.requestSchemaName ? [r.requestSchemaName] : []))]
    const resSchemaNames = [...new Set(routes.flatMap((r) => r.responseSchemaName ? [r.responseSchemaName] : []))]

    const lines: string[] = [
        `// AUTO-GENERATED — DO NOT EDIT MANUALLY`,
        `// Run \`pnpm generate:openapi\` to regenerate`,
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

function toFeatureName(file: string): string {
    return basename(file, '.ts')
        .replace(/Routes$/, '')
        .replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`)
        .replace(/^-/, '')
}

function findRouteFiles(dir: string): string[] {
    const results: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name)
        if (entry.isDirectory()) results.push(...findRouteFiles(full))
        else if (entry.isFile() && entry.name.endsWith('Routes.ts')) results.push(full)
    }
    return results
}

mkdirSync(pathsDir, { recursive: true })
const routeFiles = findRouteFiles(srcApiDir)
let scaffoldCount = 0
let totalRouteCount = 0
let resolvedCount = 0

for (const file of routeFiles) {
    const content = readFileSync(file, 'utf-8')
    const routes = parseRoutes(content)
    if (routes.length === 0) continue
    const resolved = routes.filter((r) => r.responseSchemaName).length
    resolvedCount += resolved
    totalRouteCount += routes.length
    const feature = toFeatureName(file)
    writeFileSync(resolve(pathsDir, `${feature}.ts`), generatePathsFileContent(feature, routes), 'utf-8')
    scaffoldCount++
}
console.log(`      → ${scaffoldCount} 機能ファイル生成 (${resolvedCount}/${totalRouteCount} ルートにレスポンス型)`)

// ══════════════════════════════════════════════════════════════
// STEP 4: paths/*.ts を収集して openapi.json を出力
// ══════════════════════════════════════════════════════════════
const allPaths: Record<string, Record<string, unknown>> = {}

const pathFiles = readdirSync(pathsDir)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
    .map((f) => resolve(pathsDir, f))

for (const file of pathFiles) {
    const mod = await import(pathToFileURL(file).href)
    if (!mod.paths) continue
    for (const [path, item] of Object.entries(mod.paths as Record<string, Record<string, unknown>>)) {
        allPaths[path] ??= {}
        Object.assign(allPaths[path], item)
    }
}

const doc = {
    openapi: '3.0.0',
    info: {
        title: 'tsunaca API',
        version: '1.0.0',
        description: 'tsunaca バックエンド REST API ドキュメント（自動生成）',
    },
    servers: [{ url: 'http://localhost:3001', description: 'ローカル開発' }],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
    },
    paths: allPaths,
}

mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, JSON.stringify(doc, null, 2), 'utf-8')
console.log(`\n✅ 完了: ${outFile}  (${Object.keys(allPaths).length} paths, レスポンス型解決済み: ${resolvedCount}/${totalRouteCount})`)
