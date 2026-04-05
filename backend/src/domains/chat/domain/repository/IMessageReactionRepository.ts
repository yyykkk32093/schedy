/**
 * IMessageReactionRepository — メッセージリアクションの永続化インターフェース
 */
export interface IMessageReactionRepository {
    /** スタンプリアクションを追加（既存なら無視） */
    addStampReaction(params: { messageId: string; userId: string; stampId: string }): Promise<void>

    /** 絵文字リアクションを追加（既存なら無視） */
    addEmojiReaction(params: { messageId: string; userId: string; emoji: string }): Promise<void>

    /** スタンプリアクションを削除 */
    removeStampReaction(params: { messageId: string; userId: string; stampId: string }): Promise<void>

    /** 絵文字リアクションを削除 */
    removeEmojiReaction(params: { messageId: string; userId: string; emoji: string }): Promise<void>
}
