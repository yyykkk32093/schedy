import type { IUserRepository } from '@/domains/user/domain/repository/IUserRepository.js'

export class UpdateUserProfileUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(input: {
        userId: string
        displayName?: string | null
        avatarUrl?: string | null
        biography?: string | null
    }): Promise<void> {
        const user = await this.userRepository.findById(input.userId)
        if (!user) throw new Error('User not found')

        user.updateProfile({
            displayName: input.displayName,
            avatarUrl: input.avatarUrl,
            biography: input.biography,
        })

        await this.userRepository.save(user)
    }
}
