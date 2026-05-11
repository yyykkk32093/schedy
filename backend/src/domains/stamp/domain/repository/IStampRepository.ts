/**
 * Stamp リポジトリインターフェース（カスタムスタンプ）
 */

export type StampRow = {
    id: string
    createdByUserId: string
    name: string
    imageUrl: string
    createdAt: Date
}

export interface IStampRepository {
    countByUser(userId: string): Promise<number>

    create(input: { createdByUserId: string; name: string; imageUrl: string }): Promise<StampRow>

    findById(id: string): Promise<StampRow | null>

    listByUser(userId: string): Promise<StampRow[]>

    /** スタンプ削除（紐づくリアクションもまとめて削除する） */
    deleteWithReactions(id: string): Promise<void>
}
