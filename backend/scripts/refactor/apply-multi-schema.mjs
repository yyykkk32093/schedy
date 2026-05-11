#!/usr/bin/env node
// Phase 4-B/C: schema.prisma を multi-schema + snake_case 物理名に変換するワンショットスクリプト
// 使い方: node scripts/refactor/apply-multi-schema.mjs
import fs from 'node:fs'
import path from 'node:path'

const SCHEMA_PATH = path.resolve('prisma/schema.prisma')
const MAPPING_OUT = path.resolve('scripts/refactor/table-mapping.json')

// Prisma scalar types
const SCALAR_TYPES = new Set([
    'String', 'Int', 'Float', 'BigInt', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Bytes',
])

// Model -> schema (12 schemas per Phase 4 plan)
const MODEL_SCHEMA = {
    // identity
    User: 'identity',
    // auth
    PasswordCredential: 'auth',
    GoogleCredential: 'auth',
    LineCredential: 'auth',
    AppleCredential: 'auth',
    AuthSecurityState: 'auth',
    UserWithdrawal: 'auth',
    AuthAuditLog: 'auth',
    // master
    CategoryMaster: 'master',
    CategoryMatchFormat: 'master',
    ParticipationLevelMaster: 'master',
    PlanMaster: 'master',
    PlanFeaturePolicy: 'master',
    PlanLimitPolicy: 'master',
    CommunityGradeFeaturePolicy: 'master',
    CommunityGradeLimitPolicy: 'master',
    InquiryCategoryMaster: 'master',
    // outbox
    OutboxEvent: 'outbox',
    OutboxRetryPolicy: 'outbox',
    OutboxDeadLetter: 'outbox',
    // community
    Community: 'community',
    CommunityMembership: 'community',
    CommunityLocation: 'community',
    CommunityJoinRequest: 'community',
    CommunityBookmark: 'community',
    CommunityCategory: 'community',
    CommunityParticipationLevel: 'community',
    CommunityActivityDay: 'community',
    CommunityTag: 'community',
    CommunityAuditLog: 'community',
    CommunityWebhookConfig: 'community',
    InviteToken: 'community',
    InviteTokenUsage: 'community',
    // activity
    Activity: 'activity',
    Place: 'activity',
    Schedule: 'activity',
    Participation: 'activity',
    WaitlistEntry: 'activity',
    ParticipationAuditLog: 'activity',
    WaitlistAuditLog: 'activity',
    // messaging
    ChatChannel: 'messaging',
    Message: 'messaging',
    MessageAttachment: 'messaging',
    MessageReaction: 'messaging',
    DMParticipant: 'messaging',
    Stamp: 'messaging',
    ChannelReadState: 'messaging',
    // announcement
    Announcement: 'announcement',
    AnnouncementRead: 'announcement',
    AnnouncementLike: 'announcement',
    AnnouncementComment: 'announcement',
    AnnouncementAttachment: 'announcement',
    AnnouncementBookmark: 'announcement',
    Poll: 'announcement',
    PollOption: 'announcement',
    PollVote: 'announcement',
    // media
    Album: 'media',
    AlbumPhoto: 'media',
    // notification
    Notification: 'notification',
    DeviceToken: 'notification',
    // billing
    Payment: 'billing',
    // support
    Inquiry: 'support',
    InquiryMessage: 'support',
    InquiryAttachment: 'support',
    HelpFeedback: 'support',
    ExpenseCategory: 'support',
    Expense: 'support',
    MatchingResult: 'support',
}

const SCHEMAS = [
    'activity', 'announcement', 'auth', 'billing', 'community',
    'identity', 'master', 'media', 'messaging', 'notification', 'outbox', 'support',
]

function camelToSnake(s) {
    // userId -> user_id, payPayId -> pay_pay_id, OAuth -> o_auth (none here), URLValue -> url_value
    return s
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .toLowerCase()
}

function pluralize(snake) {
    // last word
    const parts = snake.split('_')
    const last = parts[parts.length - 1]
    let pl
    if (/(s|x|sh|ch)$/.test(last)) pl = last + 'es'
    else if (/[^aeiou]y$/.test(last)) pl = last.slice(0, -1) + 'ies'
    else pl = last + 's'
    parts[parts.length - 1] = pl
    return parts.join('_')
}

function tableNameOf(modelName) {
    // Special cases
    if (modelName === 'DMParticipant') return 'dm_participants'
    if (modelName === 'PlanFeaturePolicy') return 'plan_feature_policies'
    if (modelName === 'PlanLimitPolicy') return 'plan_limit_policies'
    if (modelName === 'CommunityGradeFeaturePolicy') return 'community_grade_feature_policies'
    if (modelName === 'CommunityGradeLimitPolicy') return 'community_grade_limit_policies'
    if (modelName === 'OutboxRetryPolicy') return 'outbox_retry_policies'
    return pluralize(camelToSnake(modelName))
}

let src = fs.readFileSync(SCHEMA_PATH, 'utf8')

// 1) generator: add previewFeatures
src = src.replace(
    /generator client \{\n  provider = "prisma-client-js"\n\}/,
    `generator client {\n  provider        = "prisma-client-js"\n  previewFeatures = ["multiSchema"]\n}`,
)

// 2) datasource: add schemas
src = src.replace(
    /datasource db \{\n  provider = "postgresql"\n  url      = env\("DATABASE_URL"\)\n\}/,
    `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n  schemas  = [${SCHEMAS.map((s) => `"${s}"`).join(', ')}]\n}`,
)

const tableMapping = {} // modelName -> { table, schema, columns: { fieldName -> snake } }

function transformModel(name, body) {
    const schema = MODEL_SCHEMA[name]
    if (!schema) throw new Error(`No schema mapping for model ${name}`)
    const table = tableNameOf(name)
    const columns = {}

    const lines = body.split('\n')
    const newLines = []

    for (const line of lines) {
        const trimmed = line.trimStart()

        // Drop existing @@map / @@schema (we re-add at end)
        if (trimmed.startsWith('@@map(') || trimmed.startsWith('@@schema(')) continue

        // Skip blank/comment/model-level attribute lines untouched
        if (
            trimmed === '' ||
            trimmed.startsWith('//') ||
            trimmed.startsWith('///') ||
            trimmed.startsWith('@@') ||
            trimmed.startsWith('/*') ||
            trimmed.startsWith('*')
        ) {
            newLines.push(line)
            continue
        }

        // Field line: indent + name + Type[?][[]] + ...
        const m = line.match(/^(\s+)(\w+)\s+(\w+)(\??)(\[\])?\s*(.*)$/)
        if (!m) {
            newLines.push(line)
            continue
        }
        const [, indent, fieldName, type] = m

        // Only scalar fields get @map. Relation fields (type is a model name) are skipped.
        if (!SCALAR_TYPES.has(type)) {
            newLines.push(line)
            continue
        }

        const snake = camelToSnake(fieldName)
        columns[fieldName] = snake

        // If line already has @map(...), respect it (don't add another)
        if (line.includes('@map(')) {
            newLines.push(line)
            continue
        }

        // Append @map before any trailing inline comment
        const cmtIdx = line.indexOf('//')
        let codePart, cmtPart
        if (cmtIdx >= 0) {
            codePart = line.slice(0, cmtIdx).trimEnd()
            cmtPart = ' ' + line.slice(cmtIdx)
        } else {
            codePart = line.trimEnd()
            cmtPart = ''
        }
        newLines.push(`${codePart} @map("${snake}")${cmtPart}`)
    }

    // Trim trailing blank lines, then append @@map/@@schema
    while (newLines.length && newLines[newLines.length - 1].trim() === '') newLines.pop()
    newLines.push('')
    newLines.push(`  @@map("${table}")`)
    newLines.push(`  @@schema("${schema}")`)

    tableMapping[name] = { table, schema, columns }

    return `model ${name} {\n${newLines.join('\n')}\n}`
}

src = src.replace(/^model (\w+) \{\n([\s\S]*?)\n\}/gm, (_match, name, body) => transformModel(name, body))

fs.writeFileSync(SCHEMA_PATH, src)
fs.writeFileSync(MAPPING_OUT, JSON.stringify(tableMapping, null, 2))

console.log(`Transformed ${Object.keys(tableMapping).length} models`)
console.log(`Mapping written to ${MAPPING_OUT}`)
