/**
 * インメモリ JWT 無効化ブラックリスト
 *
 * D-P2-10: 退会済みユーザーの userId を保持し、
 * authMiddleware で JWT 検証後にチェックする。
 *
 * ⚠️ シングルプロセス前提。マルチインスタンスの場合は Redis 等に移行。
 */
const blacklistedUserIds = new Set<string>()

export function addUserToBlacklist(userId: string): void {
    blacklistedUserIds.add(userId)
}

export function isUserBlacklisted(userId: string): boolean {
    return blacklistedUserIds.has(userId)
}
