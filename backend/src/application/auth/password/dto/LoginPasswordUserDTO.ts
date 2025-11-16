// domains/auth/password/application/usecase/LoginPasswordUserDTO.ts

export interface LoginPasswordUserInput {
    email: string
    password: string
    /** クライアントのIPアドレス（任意・監査用途） */
    ipAddress?: string
}

export interface LoginPasswordUserOutput {
    userId: string
    accessToken: string
}
