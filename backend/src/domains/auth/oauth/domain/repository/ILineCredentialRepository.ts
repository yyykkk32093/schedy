export interface ILineCredentialRepository {
    findUserIdByLineUid(params: { lineUid: string }): Promise<string | null>
    link(params: { userId: string; lineUid: string }): Promise<void>
}
