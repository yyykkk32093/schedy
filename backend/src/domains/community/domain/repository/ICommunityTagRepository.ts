export interface ICommunityTagRepository {
    /** 指定コミュニティのタグ一覧（昇順） */
    findByCommunityId(communityId: string): Promise<string[]>
    /** 全件削除 */
    deleteAllByCommunityId(communityId: string): Promise<void>
    /** タグを一括追加 */
    createMany(communityId: string, tags: string[]): Promise<void>
}
