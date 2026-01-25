export interface IAppleCredentialRepository {
    findUserIdByAppleUid(params: { appleUid: string }): Promise<string | null>
    link(params: { userId: string; appleUid: string }): Promise<void>
}
