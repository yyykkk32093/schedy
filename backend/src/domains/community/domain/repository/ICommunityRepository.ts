import type { Community } from '../model/entity/Community.js'

export type CommunityListItem = {
    id: string
    parentId: string | null
    name: string
    description: string | null
    logoUrl: string | null
    coverUrl: string | null
    grade: string
    role: string
    createdBy: string
    communityTypeId: string | null
    joinMethod: string
    isPublic: boolean
    maxMembers: number | null
    latestAnnouncementTitle: string | null
    latestAnnouncementAt: Date | null
}

export type CommunityDetail = {
    id: string
    parentId: string | null
    name: string
    description: string | null
    logoUrl: string | null
    coverUrl: string | null
    grade: string
    createdBy: string
    communityTypeId: string | null
    joinMethod: string
    isPublic: boolean
    maxMembers: number | null
    activityFrequency: string | null
    targetGender: string[]
    ageMin: number | null
    ageMax: number | null
    recommendedLevelMin: number | null
    recommendedLevelMax: number | null
    payPayId: string | null
    enabledPaymentMethods: string[]
    stripeAccountId: string | null
    categories: Array<{ id: string; name: string; nameEn: string }>
    participationLevels: Array<{ id: string; name: string; nameEn: string }>
    activityDays: string[]
    tags: string[]
    memberCount: number
    /** 活動拠点（MAIN/SUB） */
    locations: Array<{
        id: string
        type: 'MAIN' | 'SUB'
        area: string
        station: string | null
        sortOrder: number
    }>
}

/** 公開コミュニティ検索結果の1行 */
export type PublicCommunitySearchItem = {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    joinMethod: string
    memberCount: number
    categories: Array<{ id: string; name: string }>
    participationLevels: Array<{ id: string; name: string }>
    // W4-03: 追加表示フィールド
    targetGender: string[]
    ageMin: number | null
    ageMax: number | null
    activityFrequency: string | null
    communityTypeName: string | null
}

/** 公開コミュニティ検索の条件 */
export type SearchCommunitiesParams = {
    keyword?: string
    categoryIds?: string[]
    levelIds?: string[]
    area?: string
    days?: string[]
    // W4-03: 追加フィルタ
    targetGender?: string[]
    communityTypeId?: string
    joinMethod?: string
    limit?: number
    offset?: number
}

/** サブコミュニティ一覧行（カルーセル表示用） */
export type SubCommunityListItem = {
    id: string
    name: string
    logoUrl: string | null
    memberCount: number
}

export interface ICommunityRepository {
    findById(id: string): Promise<Community | null>
    findsByCreatedBy(createdBy: string): Promise<Community[]>
    save(community: Community): Promise<void>
    findListByMemberUserId(userId: string): Promise<CommunityListItem[]>
    findDetailById(id: string): Promise<CommunityDetail | null>
    /** 公開コミュニティの全文検索 + フィルタ */
    searchPublic(params: SearchCommunitiesParams): Promise<{ items: PublicCommunitySearchItem[]; total: number }>
    /** 公開コミュニティ詳細（未所属者向け） */
    findPublicDetailById(id: string): Promise<CommunityDetail | null>
    /** W4-05: 子コミュニティIDリスト取得（active のみ） */
    findChildrenIds(parentId: string): Promise<string[]>
    /** 子コミュニティ一覧（詳細付き） */
    findChildrenWithDetails(parentId: string): Promise<SubCommunityListItem[]>
}
