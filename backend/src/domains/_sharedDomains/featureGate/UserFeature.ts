/**
 * ユーザープラン別 機能ON/OFF 制限 — Feature enum
 * DB テーブル: UserFeatureRestriction.feature に対応
 */
export const UserFeature = {
    /** DM新規開始 */
    DM_CREATE: 'DM_CREATE',
    /** チャット検索 */
    CHAT_SEARCH: 'CHAT_SEARCH',
    /** ファイル/写真添付 */
    FILE_ATTACHMENT: 'FILE_ATTACHMENT',
    /** ピン留め・ブックマーク */
    PIN_BOOKMARK: 'PIN_BOOKMARK',
    /** 外部カレンダーエクスポート */
    CALENDAR_EXPORT: 'CALENDAR_EXPORT',
    /** 外部通知連携（Slack/LINE/Discord） */
    EXTERNAL_NOTIFICATION: 'EXTERNAL_NOTIFICATION',
    /** 広告非表示 */
    AD_FREE: 'AD_FREE',
    /** カスタムスタンプ作成 */
    CUSTOM_STAMP: 'CUSTOM_STAMP',
} as const

export type UserFeatureType = (typeof UserFeature)[keyof typeof UserFeature]

/**
 * ユーザープラン別 数量上限 — LimitKey enum
 * DB テーブル: UserLimitRestriction.limitKey に対応
 */
export const UserLimitKey = {
    /** 参加コミュニティ数上限 */
    MAX_JOIN_COMMUNITIES: 'maxJoinCommunities',
    /** ルートコミュニティ作成上限 */
    MAX_ROOT_COMMUNITIES: 'maxRootCommunities',
    /** サブコミュニティ作成上限 */
    MAX_SUB_COMMUNITIES: 'maxSubCommunities',
    /** カスタムスタンプ登録上限 */
    MAX_CUSTOM_STAMPS: 'maxCustomStamps',
} as const

export type UserLimitKeyType = (typeof UserLimitKey)[keyof typeof UserLimitKey]
