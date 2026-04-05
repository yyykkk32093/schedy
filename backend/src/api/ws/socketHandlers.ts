import { prisma } from '@/_sharedTech/db/client.js'
import { logger } from '@/_sharedTech/logger/logger.js'
import { usecaseFactory } from '@/api/_usecaseFactory.js'
import { SocketIoRealtimeEmitter } from '@/api/ws/SocketIoRealtimeEmitter.js'
import { NotificationRepositoryImpl } from '@/application/_sharedApplication/notification/NotificationRepositoryImpl.js'
import { NotificationService } from '@/application/_sharedApplication/notification/NotificationService.js'
import { OutboxRepository } from '@/integration/outbox/repository/OutboxRepository.js'
import type { Server, Socket } from 'socket.io'

interface AuthenticatedSocket extends Socket {
    user: { userId: string; email: string }
}

/**
 * Socket.io イベントハンドラ登録
 */
export function registerSocketHandlers(io: Server): void {
    io.on('connection', (rawSocket: Socket) => {
        const socket = rawSocket as AuthenticatedSocket
        const userId = socket.user.userId
        logger.info({ userId }, '[WS] connected')

        // ユーザー固有ルームに参加（通知配信用）
        socket.join(`user:${userId}`)

        // ----- channel:join -----
        socket.on('channel:join', async (channelId: string) => {
            try {
                // メンバーシップ確認（チャンネルにアクセス権があるか）
                const channel = await prisma.chatChannel.findUnique({
                    where: { id: channelId },
                    select: { type: true, communityId: true, activityId: true },
                })

                if (!channel) {
                    socket.emit('error', { code: 'CHANNEL_NOT_FOUND', message: 'チャンネルが見つかりません' })
                    return
                }

                // DM の場合は DMParticipant を確認
                if (channel.type === 'DM') {
                    const participant = await prisma.dMParticipant.findUnique({
                        where: { channelId_userId: { channelId, userId } },
                    })
                    if (!participant) {
                        socket.emit('error', { code: 'FORBIDDEN', message: 'このDMにアクセスする権限がありません' })
                        return
                    }
                } else {
                    // COMMUNITY / ACTIVITY の場合はコミュニティメンバーシップを確認
                    let communityId = channel.communityId
                    if (channel.type === 'ACTIVITY' && channel.activityId) {
                        const activity = await prisma.activity.findUnique({
                            where: { id: channel.activityId },
                            select: { communityId: true },
                        })
                        communityId = activity?.communityId ?? null
                    }
                    if (communityId) {
                        const membership = await prisma.communityMembership.findUnique({
                            where: { communityId_userId: { communityId, userId } },
                        })
                        if (!membership || membership.leftAt) {
                            socket.emit('error', { code: 'FORBIDDEN', message: 'このチャンネルにアクセスする権限がありません' })
                            return
                        }
                    }
                }

                socket.join(`channel:${channelId}`)
                logger.info({ userId, channelId }, '[WS] channel:join')
            } catch (err) {
                logger.error({ err, channelId }, '[WS] channel:join error')
                socket.emit('error', { code: 'INTERNAL', message: 'サーバーエラー' })
            }
        })

        // ----- channel:leave -----
        socket.on('channel:leave', (channelId: string) => {
            socket.leave(`channel:${channelId}`)
            logger.info({ userId, channelId }, '[WS] channel:leave')
        })

        // ----- message:send -----
        socket.on('message:send', async (data: {
            channelId: string
            content: string
            parentMessageId?: string
            mentions?: string[]
        }) => {
            try {
                const { channelId, content, parentMessageId, mentions } = data

                // ユーザー情報取得（broadcast ペイロード用）
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { displayName: true, avatarUrl: true },
                })

                const useCase = usecaseFactory.createSendMessageUseCase()
                const result = await useCase.execute({
                    channelId,
                    senderId: userId,
                    senderDisplayName: user?.displayName ?? null,
                    senderAvatarUrl: user?.avatarUrl ?? null,
                    content,
                    parentMessageId: parentMessageId || null,
                    mentions: mentions ?? [],
                })

                // ルームに配信
                if (result.type === 'thread_reply') {
                    // スレッド返信: thread:new イベントで配信
                    io.to(`channel:${channelId}`).emit('thread:new', {
                        reply: {
                            id: result.message.id,
                            channelId: result.message.channelId,
                            senderId: result.message.senderId,
                            senderDisplayName: result.senderDisplayName,
                            senderAvatarUrl: result.senderAvatarUrl,
                            parentMessageId: result.parentMessageId,
                            content: result.message.content,
                            mentions: result.message.mentions,
                            isPinned: result.message.isPinned,
                            attachments: [],
                            reactions: [],
                            createdAt: result.message.createdAt.toISOString(),
                        },
                        parentMessageId: result.parentMessageId,
                        replyCount: result.replyCount,
                    })
                } else {
                    // トップレベルメッセージ: message:new イベントで配信
                    io.to(`channel:${channelId}`).emit('message:new', {
                        id: result.message.id,
                        channelId: result.message.channelId,
                        senderId: result.message.senderId,
                        senderDisplayName: result.senderDisplayName,
                        senderAvatarUrl: result.senderAvatarUrl,
                        parentMessageId: result.message.parentMessageId,
                        content: result.message.content,
                        mentions: result.message.mentions,
                        isPinned: result.message.isPinned,
                        attachments: [],
                        reactions: [],
                        replyCount: 0,
                        createdAt: result.message.createdAt.toISOString(),
                    })
                }

                // メンション通知（NotificationService 経由で統一）
                if (mentions && mentions.length > 0) {
                    const emitter = new SocketIoRealtimeEmitter(io)
                    const notificationService = new NotificationService(emitter)

                    for (const mentionedUserId of mentions) {
                        if (mentionedUserId === userId) continue // 自分自身は除外
                        await prisma.$transaction(async (tx) => {
                            const repos = {
                                notification: new NotificationRepositoryImpl(tx),
                                outbox: new OutboxRepository(tx),
                            }
                            await notificationService.prepareNotification(repos, {
                                userId: mentionedUserId,
                                type: 'MENTION',
                                title: 'メンションされました',
                                body: content.trim().substring(0, 100),
                                referenceId: result.message.id,
                                referenceType: 'MESSAGE',
                                metadata: {
                                    channelId,
                                    senderName: user?.displayName ?? undefined,
                                },
                            })
                        })
                        notificationService.flush()
                    }
                }

                logger.info({ userId, channelId, messageId: result.message.id }, '[WS] message:send')
            } catch (err: unknown) {
                const error = err as { code?: string; message?: string }
                logger.error({ err, data }, '[WS] message:send error')
                socket.emit('error', {
                    code: error.code ?? 'INTERNAL',
                    message: error.message ?? 'メッセージ送信に失敗しました',
                })
            }
        })

        // ----- message:typing -----
        socket.on('message:typing', (channelId: string) => {
            socket.to(`channel:${channelId}`).emit('message:typing', { userId, channelId })
        })

        // ----- reaction:add -----
        socket.on('reaction:add', async (data: { messageId: string; stampId?: string; emoji?: string }) => {
            try {
                const { messageId, stampId, emoji } = data
                if (!stampId && !emoji) return

                const useCase = usecaseFactory.createAddReactionUseCase()
                const result = await useCase.execute({ messageId, userId, stampId, emoji })

                io.to(`channel:${result.channelId}`).emit('reaction:updated', { messageId })
                logger.info({ userId, messageId, stampId, emoji }, '[WS] reaction:add')
            } catch (err) {
                logger.error({ err }, '[WS] reaction:add error')
            }
        })

        // ----- reaction:remove -----
        socket.on('reaction:remove', async (data: { messageId: string; stampId?: string; emoji?: string }) => {
            try {
                const { messageId, stampId, emoji } = data

                const useCase = usecaseFactory.createRemoveReactionUseCase()
                const result = await useCase.execute({ messageId, userId, stampId, emoji })

                io.to(`channel:${result.channelId}`).emit('reaction:updated', { messageId })
                logger.info({ userId, messageId, stampId, emoji }, '[WS] reaction:remove')
            } catch (err) {
                logger.error({ err }, '[WS] reaction:remove error')
            }
        })

        // ----- disconnect -----
        socket.on('disconnect', (reason: string) => {
            logger.info({ userId, reason }, '[WS] disconnected')
        })
    })
}
