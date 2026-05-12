/**
 * コントローラーメソッドへの Response<T> 型注釈自動付与スクリプト
 *
 * 使い方:
 *   pnpm annotate:controllers
 *
 * 動作:
 *   1. src/api/front/ 配下の *Controller.ts を全スキャン
 *   2. 対応するルートファイル (*Routes.ts) を探してメソッド → レスポンス型をマッピング
 *   3. コントローラーメソッドの `res: Response` を `res: Response<XxxResponse>` に書き換える
 *
 * 注意:
 *   - 既に型注釈がついている行はスキップ
 *   - 再実行しても冪等
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcApiDir = resolve(__dirname, '../../src/api')
const responseSchemasFile = resolve(__dirname, '../../src/api/schemas/responseSchemas.ts')

// responseSchemas.ts から「型名（スキーマ名なし）」を収集
const responseSchemasContent = readFileSync(responseSchemasFile, 'utf-8')
const allResponseTypeNames = new Set(
    [...responseSchemasContent.matchAll(/^export type (\w+) = /gm)].map((m) => m[1]),
)

// ── ファイル収集 ──────────────────────────────────────────────
function findFiles(dir: string, suffix: string): string[] {
    const results: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name)
        if (entry.isDirectory()) results.push(...findFiles(full, suffix))
        else if (entry.isFile() && entry.name.endsWith(suffix)) results.push(full)
    }
    return results
}

// ── ルートファイルから method × path → コントローラーメソッド名 → 型 のマップを構築 ──

/**
 * ルートファイルの各行から:
 *   router.get('/v1/foo', authMiddleware, fooController.bar)
 *   → { controllerMethod: 'bar', responseType: 'XxxResponseSchema' }
 */
function buildMethodTypeMap(routeContent: string): Map<string, string> {
    const map = new Map<string, string>()

    // responseSchemas の型名から逆引き用マップを作る
    function inferResponseType(method: string, rawPath: string): string | null {
        const segments = rawPath
            .split('/')
            .filter((s) => s && s !== 'v1' && !s.startsWith(':'))

        const toPascal = (s: string) =>
            s.replace(/-/g, '_').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')

        const last = segments[segments.length - 1] ?? ''
        const prev = segments[segments.length - 2] ?? ''
        const lastP = toPascal(last)
        const prevP = toPascal(prev)

        const candidates: string[] = []
        if (method === 'get') {
            candidates.push(
                `${lastP}Response`,
                `${lastP}Detail`,
                `List${lastP}Response`,
                `Get${lastP}Response`,
                `${prevP}${lastP}Response`,
                `${lastP}`,
            )
        } else if (method === 'post') {
            candidates.push(
                `Create${lastP}Response`,
                `Create${prevP}${lastP}Response`,
                `${lastP}Response`,
            )
        } else if (method === 'patch' || method === 'put') {
            candidates.push(`Update${lastP}Response`, `Update${prevP}Response`, `${lastP}Response`)
        }

        for (const c of candidates) {
            if (allResponseTypeNames.has(c)) return c
        }
        return null
    }

    for (const line of routeContent.split('\n')) {
        const m = line.match(
            /router\.(get|post|patch|put|delete)\(\s*['"`]([^'"`]+)['"`].*?(\w+)Controller\.(\w+)\s*\)/,
        )
        if (!m) continue
        const [, method, rawPath, , controllerMethod] = m
        const resType = inferResponseType(method, rawPath)
        if (resType) map.set(controllerMethod, resType)
    }
    return map
}

// ── コントローラーへの型注釈付与 ─────────────────────────────

function annotateController(controllerPath: string, methodTypeMap: Map<string, string>): boolean {
    if (methodTypeMap.size === 0) return false
    let content = readFileSync(controllerPath, 'utf-8')
    const original = content

    // 既存の import from 'express' 行を検出
    const importLine = content.match(/^import\s+.*\s+from\s+['"]express['"].*$/m)?.[0]

    const typesUsed = new Set<string>()

    // async methodName(req: Request, res: Response, next: NextFunction) の res: Response を書き換える
    for (const [method, resType] of methodTypeMap) {
        // res: Response<...> 既に付いていたらスキップ
        const regex = new RegExp(
            `(async\\s+${method}\\s*\\([^)]*\\bres\\s*:\\s*)Response(?!<)`,
            'g',
        )
        if (regex.test(content)) {
            content = content.replace(
                new RegExp(
                    `(async\\s+${method}\\s*\\([^)]*\\bres\\s*:\\s*)Response(?!<)`,
                    'g',
                ),
                `$1Response<${resType}>`,
            )
            typesUsed.add(resType)
        }
    }

    if (typesUsed.size === 0 || content === original) return false

    // import 文に型を追加
    if (importLine) {
        const typesList = [...typesUsed].join(', ')
        // responseSchemas の import がなければ追加
        if (!content.includes("from '@/api/schemas/responseSchemas.js'")) {
            const insertAfter = importLine
            content = content.replace(
                insertAfter,
                `${insertAfter}\nimport type { ${typesList} } from '@/api/schemas/responseSchemas.js'`,
            )
        } else {
            // 既存の import に型を追記
            content = content.replace(
                /import type \{([^}]+)\} from '@\/api\/schemas\/responseSchemas\.js'/,
                (_, existing: string) => {
                    const existingTypes = existing.split(',').map((s) => s.trim()).filter(Boolean)
                    const merged = [...new Set([...existingTypes, ...typesUsed])].sort()
                    return `import type { ${merged.join(', ')} } from '@/api/schemas/responseSchemas.js'`
                },
            )
        }
    }

    writeFileSync(controllerPath, content, 'utf-8')
    return true
}

// ── main ──────────────────────────────────────────────────────

const routeFiles = findFiles(srcApiDir, 'Routes.ts')
const controllerFiles = findFiles(srcApiDir, 'Controller.ts')

// ルートファイルを feature basename でインデックス化
// e.g. announcementRoutes.ts → 'announcement'
const routeMap = new Map<string, string>()
for (const f of routeFiles) {
    const key = basename(f, '.ts').replace(/Routes$/, '').toLowerCase()
    routeMap.set(key, f)
}

let annotatedCount = 0
for (const controllerFile of controllerFiles) {
    const key = basename(controllerFile, '.ts').replace(/Controller$/, '').toLowerCase()
    const routeFile = routeMap.get(key)
    if (!routeFile) continue

    const routeContent = readFileSync(routeFile, 'utf-8')
    const methodTypeMap = buildMethodTypeMap(routeContent)
    if (annotateController(controllerFile, methodTypeMap)) {
        console.log(`  ✓ ${basename(controllerFile)} (${[...methodTypeMap.keys()].join(', ')})`)
        annotatedCount++
    }
}

console.log(`\n✅ ${annotatedCount} コントローラーを更新`)
