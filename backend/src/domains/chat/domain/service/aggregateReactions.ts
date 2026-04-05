import type { RawReactionDto } from '../repository/IMessageRepository.js'

export interface ReactionSummary {
    stampId: string | null
    emoji: string | null
    stampImageUrl: string | null
    count: number
    reacted: boolean
}

/**
 * リアクション集計 — 個別リアクションを stampId / emoji ごとにグルーピング
 */
export function aggregateReactions(reactions: RawReactionDto[], currentUserId: string): ReactionSummary[] {
    const map = new Map<string, ReactionSummary>()

    for (const r of reactions) {
        const key = r.stampId ? `stamp:${r.stampId}` : r.emoji ? `emoji:${r.emoji}` : null
        if (!key) continue

        const existing = map.get(key)
        if (existing) {
            existing.count++
            if (r.userId === currentUserId) existing.reacted = true
        } else {
            map.set(key, {
                stampId: r.stampId,
                emoji: r.emoji,
                stampImageUrl: r.stamp?.imageUrl ?? null,
                count: 1,
                reacted: r.userId === currentUserId,
            })
        }
    }

    return Array.from(map.values())
}
