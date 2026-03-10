import type { Poll } from '../model/entity/Poll.js'

export interface PollResultRow {
    id: string
    communityId: string
    announcementId: string | null
    question: string
    isMultipleChoice: boolean
    deadline: string | null
    createdBy: string
    createdAt: string
    options: Array<{
        id: string
        text: string
        sortOrder: number
        voteCount: number
        voters: Array<{ userId: string; displayName: string | null; avatarUrl: string | null }>
    }>
    totalVotes: number
}

export interface IPollRepository {
    findById(id: string): Promise<Poll | null>
    findsByCommunityId(communityId: string): Promise<Poll[]>
    findsByAnnouncementId(announcementId: string): Promise<Poll[]>
    save(poll: Poll): Promise<void>

    /**
     * 投票結果を取得（集計済み）
     */
    findResultById(pollId: string): Promise<PollResultRow | null>
}
