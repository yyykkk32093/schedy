import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'

export class GetUserProfileUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(input: { userId: string }): Promise<{
        id: string
        displayName: string | null
        email: string | null
        phone: string | null
        biography: string | null
        avatarUrl: string | null
        plan: string
    }> {
        const user = await this.userRepository.findById(input.userId)
        if (!user) throw new Error('User not found')

        return {
            id: user.getId().getValue(),
            displayName: user.getDisplayName()?.getValue() ?? null,
            email: user.getEmail()?.getValue() ?? null,
            phone: user.getPhone()?.getValue() ?? null,
            biography: user.getBiography()?.getValue() ?? null,
            avatarUrl: user.getAvatarUrl()?.getValue() ?? null,
            plan: user.getPlan().getValue(),
        }
    }
}
