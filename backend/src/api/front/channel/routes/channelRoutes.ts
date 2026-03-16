import { prisma } from '@/_sharedTech/db/client.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

// ============================================================
// GET /v1/channels — 自分が参加する全チャンネル一覧
// ============================================================

/**
 * GET /v1/channels
 * 認証ユーザーが参加する全チャンネルを
 * { community, activity, dm } のグルーピングで返す。
 * 各セクション内は最新メッセージの降順ソート。
 */
router.get('/v1/channels', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        // ── 1. ユーザーが所属するコミュニティ一覧を取得 ──
        const memberships = await prisma.communityMembership.findMany({
            where: { userId, leftAt: null },
            select: { communityId: true },
        });
        const communityIds = memberships.map((m) => m.communityId);

        // ── 2. Community チャンネル ──
        const communityChannels = communityIds.length > 0
            ? await prisma.chatChannel.findMany({
                where: { type: 'COMMUNITY', communityId: { in: communityIds } },
                include: {
                    community: { select: { id: true, name: true, logoUrl: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        where: { parentMessageId: null },
                    },
                },
            })
            : [];

        // ── 3. Activity チャンネル（コミュニティ配下のアクティビティ） ──
        const activityChannels = communityIds.length > 0
            ? await prisma.chatChannel.findMany({
                where: {
                    type: 'ACTIVITY',
                    activity: { communityId: { in: communityIds }, deletedAt: null },
                },
                include: {
                    activity: {
                        select: {
                            id: true,
                            title: true,
                            community: { select: { id: true, name: true } },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        where: { parentMessageId: null },
                    },
                },
            })
            : [];

        // ── 3b. Activity チャンネルに紐づくスケジュール情報を取得 ──
        const activityIdsForChannels = activityChannels
            .map((ch) => ch.activityId)
            .filter((id): id is string => id !== null);

        const scheduleMap = new Map<string, { date: string; startTime: string; endTime: string }>();
        if (activityIdsForChannels.length > 0) {
            const now = new Date();
            const schedules = await prisma.schedule.findMany({
                where: { activityId: { in: activityIdsForChannels } },
                select: { activityId: true, date: true, startTime: true, endTime: true },
                orderBy: { date: 'asc' },
            });

            // アクティビティごとに最も近い未来 or 最新の過去のスケジュールを選択
            const grouped = new Map<string, typeof schedules>();
            for (const s of schedules) {
                const arr = grouped.get(s.activityId) ?? [];
                arr.push(s);
                grouped.set(s.activityId, arr);
            }

            for (const [actId, items] of grouped) {
                const future = items.find((s) => s.date >= now);
                const picked = future ?? items[items.length - 1];
                if (picked) {
                    // DateTime @db.Date → "YYYY-MM-DD" 形式に変換
                    const dateStr = picked.date.toISOString().slice(0, 10);
                    scheduleMap.set(actId, {
                        date: dateStr,
                        startTime: picked.startTime,
                        endTime: picked.endTime,
                    });
                }
            }
        }

        // ── 4. DM チャンネル ──
        const dmParticipations = await prisma.dMParticipant.findMany({
            where: { userId },
            include: {
                channel: {
                    include: {
                        dmParticipants: true,
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            where: { parentMessageId: null },
                        },
                    },
                },
            },
        });

        // ── 5. レスポンス構築 ──
        const formatLastMessage = (messages: { id: string; senderId: string; content: string; createdAt: Date }[]) => {
            const m = messages[0];
            return m
                ? { id: m.id, senderId: m.senderId, content: m.content, createdAt: m.createdAt.toISOString() }
                : null;
        };

        // セクション内ソート: 最新メッセージの降順
        const sortByLatest = <T extends { lastMessage: { createdAt: string } | null }>(items: T[]): T[] =>
            items.sort((a, b) => {
                const ta = a.lastMessage?.createdAt ?? '';
                const tb = b.lastMessage?.createdAt ?? '';
                return tb.localeCompare(ta);
            });

        const community = sortByLatest(
            communityChannels.map((ch) => ({
                channelId: ch.id,
                type: 'COMMUNITY' as const,
                name: ch.community?.name ?? '',
                avatarUrl: ch.community?.logoUrl ?? null,
                communityId: ch.communityId,
                lastMessage: formatLastMessage(ch.messages),
            })),
        );

        const activity = sortByLatest(
            activityChannels.map((ch) => {
                const sched = ch.activityId ? scheduleMap.get(ch.activityId) : undefined;
                return {
                    channelId: ch.id,
                    type: 'ACTIVITY' as const,
                    name: ch.activity?.title ?? '',
                    subtitle: ch.activity?.community?.name ?? '',
                    communityName: ch.activity?.community?.name ?? '',
                    activityId: ch.activityId,
                    scheduleDate: sched?.date ?? null,
                    scheduleStartTime: sched?.startTime ?? null,
                    scheduleEndTime: sched?.endTime ?? null,
                    lastMessage: formatLastMessage(ch.messages),
                };
            }),
        );

        const dm = sortByLatest(
            dmParticipations.map((p) => ({
                channelId: p.channel.id,
                type: 'DM' as const,
                participants: p.channel.dmParticipants.map((dp) => dp.userId),
                lastMessage: formatLastMessage(p.channel.messages),
            })),
        );

        res.json({ community, activity, dm });
    } catch (err) {
        next(err);
    }
});

export default router;
