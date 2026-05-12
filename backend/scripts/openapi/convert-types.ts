/**
 * フロントエンド型定義 → バックエンド Zod スキーマ 自動変換スクリプト
 *
 * 使い方:
 *   pnpm generate:response-schemas
 *
 * 入力: frontend/src/shared/types/api.ts (TypeScript interface / type)
 * 出力: backend/src/api/schemas/responseSchemas.ts (Zod v4 スキーマ)
 *
 * 変換後は `pnpm generate:openapi:scaffold` を再実行してパス定義に反映させること。
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    Project,
    SyntaxKind,
    type InterfaceDeclaration,
    type PropertySignature,
    type TypeAliasDeclaration,
    type TypeNode,
} from 'ts-morph'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputFile = resolve(__dirname, '../../../frontend/src/shared/types/api.ts')
const outputFile = resolve(__dirname, '../../src/api/schemas/responseSchemas.ts')

const project = new Project({ skipAddingFilesFromTsConfig: true })
const sourceFile = project.addSourceFileAtPath(inputFile)

// ── TypeNode → Zod 式 変換 ──────────────────────────────────

/**
 * TypeScript の TypeNode を Zod の式文字列に変換する。
 * 再帰的に処理することでネストした型にも対応。
 * selfName: 現在生成中のスキーマ名（自己参照検出に使用）
 */
function toZod(node: TypeNode, depth = 0, selfName?: string): string {
    const indent = '    '.repeat(depth)

    switch (node.getKind()) {
        case SyntaxKind.StringKeyword:
            return 'z.string()'
        case SyntaxKind.NumberKeyword:
            return 'z.number()'
        case SyntaxKind.BooleanKeyword:
            return 'z.boolean()'
        case SyntaxKind.NullKeyword:
            return 'z.null()'
        case SyntaxKind.UndefinedKeyword:
            return 'z.undefined()'
        case SyntaxKind.UnknownKeyword:
            return 'z.unknown()'
        case SyntaxKind.AnyKeyword:
            return 'z.unknown()'
        case SyntaxKind.NeverKeyword:
            return 'z.never()'

        case SyntaxKind.LiteralType: {
            const lit = node.asKindOrThrow(SyntaxKind.LiteralType).getLiteral()
            switch (lit.getKind()) {
                case SyntaxKind.StringLiteral:
                    return `z.literal(${lit.getText()})`
                case SyntaxKind.NumericLiteral:
                    return `z.literal(${lit.getText()})`
                case SyntaxKind.TrueKeyword:
                    return 'z.literal(true)'
                case SyntaxKind.FalseKeyword:
                    return 'z.literal(false)'
                default:
                    return 'z.unknown()'
            }
        }

        case SyntaxKind.ArrayType: {
            const elem = node.asKindOrThrow(SyntaxKind.ArrayType).getElementTypeNode()
            return `z.array(${toZod(elem, depth, selfName)})`
        }

        case SyntaxKind.UnionType: {
            const types = node.asKindOrThrow(SyntaxKind.UnionType).getTypeNodes()

            const isNullNode = (t: TypeNode) => {
                if (t.getKind() === SyntaxKind.NullKeyword) return true
                if (t.getKind() === SyntaxKind.LiteralType) {
                    const lit = t.asKindOrThrow(SyntaxKind.LiteralType).getLiteral()
                    return lit.getKind() === SyntaxKind.NullKeyword
                }
                return false
            }
            const isUndefinedNode = (t: TypeNode) => t.getKind() === SyntaxKind.UndefinedKeyword

            const isNullable = types.some(isNullNode)
            const rest = types.filter((t) => !isNullNode(t) && !isUndefinedNode(t))

            let base: string
            if (rest.length === 0) {
                base = 'z.null()'
            } else if (rest.length === 1) {
                base = toZod(rest[0], depth, selfName)
            } else {
                // 全て string literal → z.enum([...])
                const allStringLit = rest.every((t) => t.getKind() === SyntaxKind.LiteralType)
                if (allStringLit) {
                    const values = rest.map((t) => t.asKindOrThrow(SyntaxKind.LiteralType).getLiteral().getText())
                    base = `z.enum([${values.join(', ')}])`
                } else {
                    base = `z.union([${rest.map((t) => toZod(t, depth, selfName)).join(', ')}])`
                }
            }
            if (isNullable) base += '.nullable()'
            return base
        }

        case SyntaxKind.TypeReference: {
            const ref = node.asKindOrThrow(SyntaxKind.TypeReference)
            const name = ref.getTypeName().getText()
            const typeArgs = ref.getTypeArguments()

            // Record<string, X>
            if (name === 'Record' && typeArgs.length === 2) {
                return `z.record(${toZod(typeArgs[0], depth, selfName)}, ${toZod(typeArgs[1], depth, selfName)})`
            }
            // Array<X>
            if (name === 'Array' && typeArgs.length === 1) {
                return `z.array(${toZod(typeArgs[0], depth, selfName)})`
            }
            // 同ファイル内で定義された型は参照
            const refDecl = sourceFile.getInterface(name) || sourceFile.getTypeAlias(name)
            if (refDecl) {
                // 自己参照の場合は z.lazy() でラップして初期化前参照を回避
                if (name === selfName) {
                    return `z.lazy(() => ${name}Schema)`
                }
                return `${name}Schema`
            }
            return 'z.unknown()'
        }

        case SyntaxKind.TypeLiteral: {
            const members = node
                .asKindOrThrow(SyntaxKind.TypeLiteral)
                .getMembers()
                .filter((m): m is PropertySignature => m.getKind() === SyntaxKind.PropertySignature)
            if (members.length === 0) return 'z.object({})'
            const fields = members.map((m) => {
                const key = m.getName()
                const safeKey = /[^a-zA-Z0-9_$]/.test(key) ? `'${key}'` : key
                const typeNode = m.getTypeNode()
                const zodExpr = typeNode ? toZod(typeNode, depth + 1, selfName) : 'z.unknown()'
                const optional = m.hasQuestionToken()
                return `${indent}    ${safeKey}: ${optional ? `${zodExpr}.optional()` : zodExpr},`
            })
            return `z.object({\n${fields.join('\n')}\n${indent}})`
        }

        case SyntaxKind.IntersectionType: {
            const types = node.asKindOrThrow(SyntaxKind.IntersectionType).getTypeNodes()
            const [first, ...rest] = types
            let base = toZod(first, depth, selfName)
            for (const t of rest) {
                base += `.merge(${toZod(t, depth, selfName)})`
            }
            return base
        }

        default:
            return 'z.unknown()'
    }
}

// ── Interface / TypeAlias → Zod const 生成 ──────────────────

function interfaceToZod(decl: InterfaceDeclaration): string {
    const name = decl.getName()
    const schemaName = `${name}Schema`
    const indent = '    '

    // extends がある場合は merge
    const baseTypes = decl.getBaseDeclarations()
    const props = decl.getProperties()

    const fields = props.map((prop) => {
        const key = prop.getName()
        const safeKey = /[^a-zA-Z0-9_$]/.test(key) ? `'${key}'` : key
        const typeNode = prop.getTypeNode()
        const zodExpr = typeNode ? toZod(typeNode, 1, name) : 'z.unknown()'
        const optional = prop.hasQuestionToken()
        return `${indent}${safeKey}: ${optional ? `${zodExpr}.optional()` : zodExpr},`
    })

    let body: string
    if (fields.length === 0) {
        body = 'z.object({})'
    } else {
        body = `z.object({\n${fields.join('\n')}\n})`
    }

    if (baseTypes.length > 0) {
        const baseNames = decl.getExtends().map((e) => `${e.getExpression().getText()}Schema`)
        body = `${baseNames[0]}.merge(${body})`
        for (const b of baseNames.slice(1)) {
            body = `${b}.merge(${body})`
        }
    }

    return `export const ${schemaName} = ${body}\nexport type ${name} = z.infer<typeof ${schemaName}>`
}

function typeAliasToZod(decl: TypeAliasDeclaration): string {
    const name = decl.getName()
    const typeNode = decl.getTypeNodeOrThrow()
    const zodExpr = toZod(typeNode, 0)
    return `export const ${name}Schema = ${zodExpr}\nexport type ${name} = z.infer<typeof ${name}Schema>`
}

// ── トポロジカルソート（依存関係解決）───────────────────────

/** ノード自身と全子孫の TypeReference 名を収集するヘルパー */
function collectRefNames(node: TypeNode, deps: string[]): void {
    // 自身が TypeReference の場合
    if (node.getKind() === SyntaxKind.TypeReference) {
        const ref = node.asKindOrThrow(SyntaxKind.TypeReference)
        const refName = ref.getTypeName().getText()
        if (sourceFile.getInterface(refName) || sourceFile.getTypeAlias(refName)) {
            deps.push(refName)
        }
    }
    // 子孫を走査
    node.forEachDescendant((child) => {
        if (child.getKind() === SyntaxKind.TypeReference) {
            const ref = child.asKindOrThrow(SyntaxKind.TypeReference)
            const refName = ref.getTypeName().getText()
            if (sourceFile.getInterface(refName) || sourceFile.getTypeAlias(refName)) {
                deps.push(refName)
            }
        }
    })
}

function getDeps(name: string): string[] {
    const deps: string[] = []

    const iface = sourceFile.getInterface(name)
    if (iface) {
        // extends
        for (const ext of iface.getExtends()) {
            const baseName = ext.getExpression().getText()
            if (sourceFile.getInterface(baseName) || sourceFile.getTypeAlias(baseName)) {
                deps.push(baseName)
            }
        }
        // プロパティ内の型参照
        for (const prop of iface.getProperties()) {
            const typeNode = prop.getTypeNode()
            if (!typeNode) continue
            collectRefNames(typeNode, deps)
        }
        return [...new Set(deps)]
    }

    const alias = sourceFile.getTypeAlias(name)
    if (alias) {
        // type alias 内の型参照を収集
        collectRefNames(alias.getTypeNodeOrThrow(), deps)
        return [...new Set(deps)]
    }

    return []
}

function topoSort(names: string[]): string[] {
    const visited = new Set<string>()
    const result: string[] = []
    function visit(name: string) {
        if (visited.has(name)) return
        visited.add(name)
        for (const dep of getDeps(name)) visit(dep)
        result.push(name)
    }
    for (const name of names) visit(name)
    return result
}

// ── main ──────────────────────────────────────────────────────

const interfaces = sourceFile.getInterfaces()
const typeAliases = sourceFile.getTypeAliases()

const allNames = [
    ...interfaces.map((i) => i.getName()),
    ...typeAliases.map((t) => t.getName()),
]
const sortedNames = topoSort(allNames)

const lines: string[] = [
    '/**',
    ' * レスポンス Zod スキーマ',
    ' * AUTO-GENERATED — DO NOT EDIT MANUALLY',
    ' * Run `pnpm generate:response-schemas` to regenerate',
    ' */',
    "import { z } from 'zod/v4'",
    '',
]

for (const name of sortedNames) {
    const iface = sourceFile.getInterface(name)
    if (iface) {
        lines.push(interfaceToZod(iface))
        lines.push('')
        continue
    }
    const alias = sourceFile.getTypeAlias(name)
    if (alias) {
        lines.push(typeAliasToZod(alias))
        lines.push('')
    }
}

writeFileSync(outputFile, lines.join('\n'), 'utf-8')
console.log(`✅ 生成完了: ${outputFile}  (${sortedNames.length} 型)`)
