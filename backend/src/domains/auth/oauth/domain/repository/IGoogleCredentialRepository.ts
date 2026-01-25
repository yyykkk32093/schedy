export interface IGoogleCredentialRepository {
    findUserIdByGoogleUid(params: { googleUid: string }): Promise<string | null>
    link(params: { userId: string; googleUid: string }): Promise<void>
}
