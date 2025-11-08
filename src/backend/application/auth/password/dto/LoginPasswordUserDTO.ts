// domains/auth/password/application/usecase/LoginPasswordUserDTO.ts
export interface LoginPasswordUserInput {
    email: string;
    password: string;
}

export interface LoginPasswordUserOutput {
    userId: string;
    accessToken: string;
}
