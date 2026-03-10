/**
 * SocketIoRealtimeEmitter
 *
 * IRealtimeEmitter の Socket.io 実装。
 * API 層（インフラ層）に配置し、Application 層からは IRealtimeEmitter として DI 注入される。
 */
import { logger } from '@/_sharedTech/logger/logger.js'
import type { IRealtimeEmitter } from '@/application/_sharedApplication/notification/IRealtimeEmitter.js'
import type { Server as SocketIOServer } from 'socket.io'

export class SocketIoRealtimeEmitter implements IRealtimeEmitter {
    constructor(private readonly io: SocketIOServer) { }

    emitToUser(userId: string, event: string, payload: unknown): void {
        try {
            this.io.to(`user:${userId}`).emit(event, payload)
        } catch (err) {
            // fire-and-forget: WS 配信失敗はログのみ（DB レコードは保存済み）
            logger.warn({ err, userId, event }, '[RealtimeEmitter] emitToUser failed')
        }
    }

    emitToChannel(channelId: string, event: string, payload: unknown): void {
        try {
            this.io.to(`channel:${channelId}`).emit(event, payload)
        } catch (err) {
            logger.warn({ err, channelId, event }, '[RealtimeEmitter] emitToChannel failed')
        }
    }
}
