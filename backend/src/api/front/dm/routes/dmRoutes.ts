import { prisma } from '@/_sharedTech/db/client.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import { requireFeature } from '@/api/middleware/featureGateMiddleware.js';
import { UserFeature } from '@/domains/_sharedDomains/featureGate/UserFeature.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

/**
 * POST /v1/dm/channels
 * DM チャンネル作成（SUBSCRIBER/LIFETIME のみ新規開始可能）
 */
router.post('/v1/dm/channels', authMiddleware, requireFeature(UserFeature.DM_CREATE), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { participantIds } = req.body as { participantIds: string[] };

        if (!participantIds || participantIds.length === 0) {
            res.status(400).json({ code: 'INVALID_REQUEST', message: '参加者が必要です' });
            return;
        }

        // 自分も含める
        const allParticipants = Array.from(new Set([userId, ...participantIds]));

        // 既存の同じ参加者セットのDMがあれば返す（2人DMの場合）
        if (allParticipants.length === 2) {
            const existing = await prisma.chatChannel.findMany({
                where: { type: 'DM' },
                include: { dmParticipants: true },
            });
            for (const ch of existing) {
                const pIds = ch.dmParticipants.map((p) => p.userId).sort();
                if (pIds.length === allParticipants.length && pIds.every((id, i) => id === allParticipants.sort()[i])) {
                    res.json({ channelId: ch.id, type: 'DM', participants: pIds });
                    return;
                }
            }
        }

        // 新規作成
        const channel = await prisma.chatChannel.create({
            data: {
                type: 'DM',
                dmParticipants: {
                    create: allParticipants.map((uid) => ({ userId: uid })),
                },
            },
            include: { dmParticipants: true },
        });

        // 参加者に通知
        const io = req.app.get('io');
        if (io) {
            for (const pid of allParticipants) {
                if (pid === userId) continue;
                await prisma.notification.create({
                    data: {
                        userId: pid,
                        type: 'DM',
                        title: '新しいDM',
                        body: 'DMが開始されました',
                        referenceId: channel.id,
                        referenceType: 'DM_CHANNEL',
                    },
                });
                io.to(`user:${pid}`).emit('notification:new', {
                    type: 'DM',
                    title: '新しいDM',
                    referenceId: channel.id,
                    referenceType: 'DM_CHANNEL',
                });
            }
        }

        res.status(201).json({
            channelId: channel.id,
            type: 'DM',
            participants: channel.dmParticipants.map((p) => p.userId),
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /v1/dm/channels
 * 自分のDMチャンネル一覧
 */
router.get('/v1/dm/channels', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        const participations = await prisma.dMParticipant.findMany({
            where: { userId },
            include: {
                channel: {
                    include: {
                        dmParticipants: true,
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });

        const channels = participations.map((p) => ({
            channelId: p.channel.id,
            participants: p.channel.dmParticipants.map((dp) => dp.userId),
            lastMessage: p.channel.messages[0]
                ? {
                    id: p.channel.messages[0].id,
                    senderId: p.channel.messages[0].senderId,
                    content: p.channel.messages[0].content,
                    createdAt: p.channel.messages[0].createdAt.toISOString(),
                }
                : null,
        }));

        res.json({ channels });
    } catch (err) {
        next(err);
    }
});

export default router;
