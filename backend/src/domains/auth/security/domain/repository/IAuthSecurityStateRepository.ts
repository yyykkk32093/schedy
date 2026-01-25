export interface IAuthSecurityStateRepository {
    findByUserId(params: { userId: string }): Promise<{
        failedSignInCount: number
        lockedUntil: Date | null
    } | null>

    recordLoginSuccess(params: {
        userId: string
        authMethod: string
        occurredAt: Date
    }): Promise<void>

    recordLoginFailure(params: {
        userId: string
        occurredAt: Date
        maxFailures: number
        lockDurationMs: number
    }): Promise<void>
}
