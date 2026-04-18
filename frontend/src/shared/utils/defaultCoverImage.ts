const COVER_COUNT = 10

/**
 * communityId のハッシュ値を算出し、デフォルトカバー画像の URL を決定論的に返す。
 * 同じ communityId では常に同じ画像が返る。
 */
export function getDefaultCoverUrl(communityId: string): string {
    let hash = 0
    for (let i = 0; i < communityId.length; i++) {
        hash = (hash * 31 + communityId.charCodeAt(i)) | 0
    }
    const index = ((hash % COVER_COUNT) + COVER_COUNT) % COVER_COUNT
    const num = String(index + 1).padStart(2, '0')
    return `/images/default-covers/cover-${num}.svg`
}
