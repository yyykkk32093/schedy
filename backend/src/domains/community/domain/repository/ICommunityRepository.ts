import type { Community } from '../model/entity/Community.js'

export type CommunityListItem = {
    id: string
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
    mainActivityArea: string | null
    latestAnnouncementTitle: string | null
    latestAnnouncementAt: Date | null
}

export type CommunityDetail = {
    id: string
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
    mainActivityArea: string | null
    activityFrequency: string | null
    nearestStation: string | null
    targetGender: string | null
    ageRange: string | null
    categories: Array<{ id: string; name: string; nameEn: string }>
    participationLevels: Array<{ id: string; name: string; nameEn: string }>
    activityDays: string[]
    tags: string[]
    memberCount: number
}

/** 公開コミュニティ検索結果の1行 */
export type PublicCommunitySearchItem = {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    mainActivityArea: string | null
    joinMethod: string
    memberCount: number
    categories: Array<{ id: string; name: string }>
    participationLevels: Array<{ id: string; name: string }>
}

/** 公開コミュニティ検索の条件 */
export type SearchCommunitiesParams = {
    keyword?: string
    categoryIds?: string[]
    levelIds?: string[]
    area?: string
    days?: string[]
    limit?: number
    offset?: number
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
}
