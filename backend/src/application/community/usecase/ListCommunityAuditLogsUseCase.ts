import type { ICommunityAuditLogRepository } from '@/domains/community/auditLog/domain/repository/ICommunityAuditLogRepository.js';
import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaClientLike = PrismaClient | Prisma.TransactionClient

export class ListCommunityAuditLogsUseCase {
    constructor(
        private readonly auditLogRepository: ICommunityAuditLogRepository,
        private readonly prisma: PrismaClientLike,
    ) { }

    async execute(input: { communityId: string; limit?: number }): Promise<{
        logs: Array<{
            id: string
            actorUserId: string
            actorDisplayName: string | null
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

        // ユーザーIDを一括収集（actor + before/after + summary 内の userId: xxx も対象）
        const userIds = new Set<string>()
        const summaryUserIdPattern = /\(userId: ([^)]+)\)/g
        for (const l of logs) {
            userIds.add(l.actorUserId)
            // ROLE_CHANGED / OWNER_TRANSFERRED / MEMBER_REMOVED の before/after にもuserIdが含まれうる
            if (l.before && this.looksLikeUserId(l.before)) userIds.add(l.before)
            if (l.after && this.looksLikeUserId(l.after)) userIds.add(l.after)
            // summary 内の (userId: xxx) からもIDを収集
            let match: RegExpExecArray | null
            while ((match = summaryUserIdPattern.exec(l.summary)) !== null) {
                userIds.add(match[1])
            }
        }

        // ユーザー名を一括取得
        const users = await this.prisma.user.findMany({
            where: { id: { in: [...userIds] } },
            select: { id: true, displayName: true },
        })
        const userMap = new Map(users.map(u => [u.id, u.displayName]))

        const resolveDisplayName = (userId: string): string =>
            userMap.get(userId) ?? '退会済みユーザー'

        /** summary 内の (userId: xxx) を (表示名) に置換 */
        const resolveSummaryUserIds = (summary: string): string =>
            summary.replace(/\(userId: ([^)]+)\)/g, (_match, id: string) => {
                const name = resolveDisplayName(id)
                return `(${name})`
            })

        return {
            logs: logs.map((l) => ({
                id: l.id ?? '',
                actorUserId: l.actorUserId,
                actorDisplayName: userMap.get(l.actorUserId) ?? '退会済みユーザー',
                action: l.action,
                field: l.field,
                before: l.before && this.looksLikeUserId(l.before) ? resolveDisplayName(l.before) : l.before,
                after: l.after && this.looksLikeUserId(l.after) ? resolveDisplayName(l.after) : l.after,
                summary: resolveSummaryUserIds(l.summary),
                createdAt: l.createdAt,
            })),
        }
    }

    /**
     * UUID形式（36文字ハイフン区切り）かどうかを簡易判定。
     * before/after にユーザーIDが入っている場合のみユーザー名に変換するため。
     */
    private looksLikeUserId(value: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    }
}
