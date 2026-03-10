import { HttpError } from '@/application/_sharedApplication/error/HttpError.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'
import type { Prisma } from '@prisma/client'
import { CommunityNotFoundError } from '../error/CommunityNotFoundError.js'

export type RequestJoinCommunityTxRepositories = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
    tx: Prisma.TransactionClient
}

/**
 * RequestJoinCommunityUseCase — joinMethod=APPROVAL のコミュニティに参加リクエスト送信
 */
export class RequestJoinCommunityUseCase {
    constructor(
        private readonly unitOfWork: {
            run<T>(fn: (repos: RequestJoinCommunityTxRepositories) => Promise<T>): Promise<T>
        },
    ) { }

    async execute(input: {
        communityId: string
        userId: string
        message?: string
    }): Promise<{ joinRequestId: string }> {
        let joinRequestId = ''

        await this.unitOfWork.run(async (repos) => {
            // コミュニティ存在確認
            const community = await repos.community.findById(input.communityId)
            if (!community || community.getDeletedAt()) {
                throw new CommunityNotFoundError()
            }

            // APPROVAL のみ
            if (community.getJoinMethod().getValue() !== 'APPROVAL') {
                throw new HttpError({
                    statusCode: 400,
                    code: 'NOT_APPROVAL_METHOD',
                    message: 'このコミュニティは承認制ではありません',
                })
            }

            // 既にメンバーチェック
            const existing = await repos.membership.findByCommunityAndUser(input.communityId, input.userId)
            if (existing && !existing.getLeftAt()) {
                throw new HttpError({ statusCode: 409, code: 'ALREADY_MEMBER', message: '既にこのコミュニティのメンバーです' })
            }

            // 既に PENDING のリクエストがあるかチェック
            const pendingRequest = await repos.tx.communityJoinRequest.findFirst({
                where: {
                    communityId: input.communityId,
                    userId: input.userId,
                    status: 'PENDING',
                },
            })
            if (pendingRequest) {
                throw new HttpError({ statusCode: 409, code: 'REQUEST_ALREADY_PENDING', message: '既に参加リクエストを送信済みです' })
            }

            // JoinRequest 作成
            const created = await repos.tx.communityJoinRequest.create({
                data: {
                    communityId: input.communityId,
                    userId: input.userId,
                    message: input.message ?? null,
                    status: 'PENDING',
                },
            })
            joinRequestId = created.id
        })

        return { joinRequestId }
    }
}
