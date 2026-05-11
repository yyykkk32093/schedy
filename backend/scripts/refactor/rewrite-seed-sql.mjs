#!/usr/bin/env node
// Phase 4-D: Seed/SQL ファイルを multi-schema + snake_case にリネームするヘルパ
// 使い方: node scripts/refactor/rewrite-seed-sql.mjs <file...>
import fs from 'node:fs'
import path from 'node:path'

const MAPPING = JSON.parse(fs.readFileSync(path.resolve('scripts/refactor/table-mapping.json'), 'utf8'))

// Build column rename map (camelCase -> snake_case). Same field across tables yields same result.
const COL_MAP = {}
for (const [, info] of Object.entries(MAPPING)) {
    for (const [camel, snake] of Object.entries(info.columns)) {
        if (camel !== snake) COL_MAP[camel] = snake
    }
}

// Build table rename map (ModelName -> schema.snake_plural)
const TABLE_MAP = {}
for (const [model, info] of Object.entries(MAPPING)) {
    TABLE_MAP[model] = `${info.schema}.${info.table}`
}

// Legacy aliases: pre-Phase 4-A model names + previous @@map values that may still appear in seed SQL
const LEGACY_ALIASES = {
    UserFeatureRestriction: 'PlanFeaturePolicy',
    UserLimitRestriction: 'PlanLimitPolicy',
    CommunityFeatureRestriction: 'CommunityGradeFeaturePolicy',
    CommunityLimitRestriction: 'CommunityGradeLimitPolicy',
    InquiryCategory: 'InquiryCategoryMaster',
    auth_security_states: 'AuthSecurityState',
}
for (const [legacy, current] of Object.entries(LEGACY_ALIASES)) {
    TABLE_MAP[legacy] = TABLE_MAP[current]
}

const files = process.argv.slice(2)
if (files.length === 0) {
    console.error('Usage: rewrite-seed-sql.mjs <file...>')
    process.exit(1)
}

for (const file of files) {
    let src = fs.readFileSync(file, 'utf8')

    // 1) Table rename: "ModelName" -> schema.snake_plural (drop quotes)
    for (const [model, schemaTable] of Object.entries(TABLE_MAP)) {
        const re = new RegExp(`"${model}"`, 'g')
        src = src.replace(re, schemaTable)
    }

    // 2) Column rename: "camelCol" -> "snake_col" (keep quotes for SQL safety)
    for (const [camel, snake] of Object.entries(COL_MAP)) {
        const re = new RegExp(`"${camel}"`, 'g')
        src = src.replace(re, `"${snake}"`)
    }

    fs.writeFileSync(file, src)
    console.log(`Rewrote ${file}`)
}
