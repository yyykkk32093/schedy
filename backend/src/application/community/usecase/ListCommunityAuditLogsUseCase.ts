import type { ICommunityAuditLogRepository } from '@/domains/community/auditLog/domain/repository/ICommunityAuditLogRepository.js';

export class ListCommunityAuditLogsUseCase {
    constructor(
        private readonly auditLogRepository: ICommunityAuditLogRepository,
    ) { }

    async execute(input: { communityId: string; limit?: number }): Promise<{
        logs: Array<{
            id: string
            actorUserId: string
            action: string
            field: string | null
            before: string | null
            after: string | null
            summary: string
            createdAt: Date
        }>
    }> {
        const logs = await this.auditLogRepository.findByCommunityId(
            input.communityId,
            input.limit ?? 50,
        )

        return {
            logs: logs.map((l) => ({
                id: l.id,
                actorUserId: l.actorUserId,
                action: l.action,
                field: l.field,
                before: l.before,
                after: l.after,
                summary: l.summary,
                createdAt: l.createdAt,
            })),
        }
    }
}
