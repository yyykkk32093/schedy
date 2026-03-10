export interface IPollVoteRepository {
    /**
     * 投票する。単一選択の場合は既存投票を削除して新規投票。
     * @returns 投票後の状態
     */
    castVote(params: {
        id: string
        pollOptionId: string
        userId: string
        isMultipleChoice: boolean
        pollId: string
    }): Promise<void>

    /**
     * ユーザーの投票済み optionId を取得
     */
    findUserVotes(pollId: string, userId: string): Promise<string[]>

    /**
     * 投票を取り消す
     */
    removeVote(pollOptionId: string, userId: string): Promise<void>
}
