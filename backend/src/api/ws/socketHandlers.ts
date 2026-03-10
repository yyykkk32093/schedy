import { prisma } from '@/_sharedTech/db/client.js';
import { logger } from '@/_sharedTech/logger/logger.js';
import type { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
    user: { userId: string; email: string };
}

/**
 * Socket.io イベントハンドラ登録
 */
export function registerSocketHandlers(io: Server): void {
    io.on('connection', (rawSocket: Socket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const userId = socket.user.userId;
        logger.info({ userId }, '[WS] connected');

        // ユーザー固有ルームに参加（通知配信用）
        socket.join(`user:${userId}`);

        // ----- channel:join -----
        socket.on('channel:join', async (channelId: string) => {
            try {
                // メンバーシップ確認（チャンネルにアクセス権があるか）
                const channel = await prisma.chatChannel.findUnique({
                    where: { id: channelId },
                    select: { type: true, communityId: true, activityId: true },
                });

                if (!channel) {
                    socket.emit('error', { code: 'CHANNEL_NOT_FOUND', message: 'チャンネルが見つかりません' });
                    return;
                }

                // DM の場合は DMParticipant を確認
                if (channel.type === 'DM') {
                    const participant = await prisma.dMParticipant.findUnique({
                        where: { channelId_userId: { channelId, userId } },
                    });
                    if (!participant) {
                        socket.emit('error', { code: 'FORBIDDEN', message: 'このDMにアクセスする権限がありません' });
                        return;
                    }
                } else {
                    // COMMUNITY / ACTIVITY の場合はコミュニティメンバーシップを確認
                    let communityId = channel.communityId;
                    if (channel.type === 'ACTIVITY' && channel.activityId) {
                        const activity = await prisma.activity.findUnique({
                            where: { id: channel.activityId },
                            select: { communityId: true },
                        });
                        communityId = activity?.communityId ?? null;
                    }
                    if (communityId) {
                        const membership = await prisma.communityMembership.findUnique({
                            where: { communityId_userId: { communityId, userId } },
                        });
                        if (!membership || membership.leftAt) {
                            socket.emit('error', { code: 'FORBIDDEN', message: 'このチャンネルにアクセスする権限がありません' });
                            return;
                        }
                    }
                }

                socket.join(`channel:${channelId}`);
                logger.info({ userId, channelId }, '[WS] channel:join');
            } catch (err) {
                logger.error({ err, channelId }, '[WS] channel:join error');
                socket.emit('error', { code: 'INTERNAL', message: 'サーバーエラー' });
            }
        });

        // ----- channel:leave -----
        socket.on('channel:leave', (channelId: string) => {
            socket.leave(`channel:${channelId}`);
            logger.info({ userId, channelId }, '[WS] channel:leave');
        });

        // ----- message:send -----
        socket.on('message:send', async (data: {
            channelId: string;
            content: string;
            parentMessageId?: string;
            mentions?: string[];
        }) => {
            try {
                const { channelId, content, parentMessageId, mentions } = data;

                if (!content?.trim()) {
                    socket.emit('error', { code: 'INVALID_CONTENT', message: 'メッセージ内容が空です' });
                    return;
                }

                // チャンネル存在確認
                const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
                if (!channel) {
                    socket.emit('error', { code: 'CHANNEL_NOT_FOUND', message: 'チャンネルが見つかりません' });
                    return;
                }

                // メッセージ保存
                const message = await prisma.message.create({
                    data: {
                        channelId,
                        senderId: userId,
                        content: content.trim(),
                        parentMessageId: parentMessageId || null,
                        mentions: mentions ?? [],
                    },
                    include: {
                        attachments: true,
                        reactions: { include: { stamp: true } },
                    },
                });

                const messagePayload = {
                    id: message.id,
                    channelId: message.channelId,
                    senderId: message.senderId,
                    parentMessageId: message.parentMessageId,
                    content: message.content,
                    mentions: message.mentions,
                    isPinned: message.isPinned,
                    attachments: message.attachments,
                    reactions: message.reactions,
                    createdAt: message.createdAt.toISOString(),
                };

                // ルームに配信
                io.to(`channel:${channelId}`).emit('message:new', messagePayload);

                // メンション通知
                if (mentions && mentions.length > 0) {
                    for (const mentionedUserId of mentions) {
                        if (mentionedUserId === userId) continue; // 自分自身は除外
                        await prisma.notification.create({
                            data: {
                                userId: mentionedUserId,
                                type: 'MENTION',
                                title: 'メンションされました',
                                body: content.trim().substring(0, 100),
                                referenceId: message.id,
                                referenceType: 'MESSAGE',
                            },
                        });
                        io.to(`user:${mentionedUserId}`).emit('notification:new', {
                            type: 'MENTION',
                            title: 'メンションされました',
                            body: content.trim().substring(0, 100),
                            referenceId: message.id,
                            referenceType: 'MESSAGE',
                        });
                    }
                }

                logger.info({ userId, channelId, messageId: message.id }, '[WS] message:send');
            } catch (err) {
                logger.error({ err }, '[WS] message:send error');
                socket.emit('error', { code: 'INTERNAL', message: 'メッセージ送信に失敗しました' });
            }
        });

        // ----- message:typing -----
        socket.on('message:typing', (channelId: string) => {
            socket.to(`channel:${channelId}`).emit('message:typing', { userId, channelId });
        });

        // ----- reaction:add -----
        socket.on('reaction:add', async (data: { messageId: string; stampId: string }) => {
            try {
                const { messageId, stampId } = data;
                const message = await prisma.message.findUnique({ where: { id: messageId }, select: { channelId: true } });
                if (!message) return;

                await prisma.messageReaction.upsert({
                    where: { messageId_userId_stampId: { messageId, userId, stampId } },
                    create: { messageId, userId, stampId },
                    update: {},
                });

                io.to(`channel:${message.channelId}`).emit('reaction:updated', { messageId });
                logger.info({ userId, messageId, stampId }, '[WS] reaction:add');
            } catch (err) {
                logger.error({ err }, '[WS] reaction:add error');
            }
        });

        // ----- reaction:remove -----
        socket.on('reaction:remove', async (data: { messageId: string; stampId: string }) => {
            try {
                const { messageId, stampId } = data;
                const message = await prisma.message.findUnique({ where: { id: messageId }, select: { channelId: true } });
                if (!message) return;

                await prisma.messageReaction.deleteMany({
                    where: { messageId, userId, stampId },
                });

                io.to(`channel:${message.channelId}`).emit('reaction:updated', { messageId });
                logger.info({ userId, messageId, stampId }, '[WS] reaction:remove');
            } catch (err) {
                logger.error({ err }, '[WS] reaction:remove error');
            }
        });

        // ----- disconnect -----
        socket.on('disconnect', (reason: string) => {
            logger.info({ userId, reason }, '[WS] disconnected');
        });
    });
}
