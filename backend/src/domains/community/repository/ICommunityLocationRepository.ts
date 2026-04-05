/**
 * ICommunityLocationRepository
 *
 * CommunityLocation テーブルへの CRUD を抽象化するリポジトリインターフェース。
 */

export interface CommunityLocationDTO {
    id: string
    communityId: string
    type: 'MAIN' | 'SUB'
    area: string
    station: string | null
    sortOrder: number
    createdAt: Date
    updatedAt: Date
}

export interface CreateCommunityLocationInput {
    id: string
    communityId: string
    type: 'MAIN' | 'SUB'
    area: string
    station?: string | null
    sortOrder: number
}

export interface UpdateCommunityLocationInput {
    type?: 'MAIN' | 'SUB'
    area?: string
    station?: string | null
    sortOrder?: number
}

export interface ICommunityLocationRepository {
    findByCommunityId(communityId: string): Promise<CommunityLocationDTO[]>
    findById(id: string): Promise<CommunityLocationDTO | null>
    create(input: CreateCommunityLocationInput): Promise<CommunityLocationDTO>
    update(id: string, input: UpdateCommunityLocationInput): Promise<CommunityLocationDTO>
    delete(id: string): Promise<void>
    deleteAllByCommunityId(communityId: string): Promise<void>
    /** 一括置き換え（設定画面のsave-all用途） */
    replaceAll(communityId: string, locations: CreateCommunityLocationInput[]): Promise<CommunityLocationDTO[]>
}
