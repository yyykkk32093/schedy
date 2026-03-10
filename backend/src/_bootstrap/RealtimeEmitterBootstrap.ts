/**
 * RealtimeEmitterBootstrap
 *
 * IRealtimeEmitter のシングルトン管理。
 * server.ts で Socket.io Server 起動後に initialize() を呼び、
 * _usecaseFactory.ts から getEmitter() で取得する。
 *
 * ApplicationEventBootstrap / DomainEventBootstrap と同じパターン。
 */
import { SocketIoRealtimeEmitter } from '@/api/ws/SocketIoRealtimeEmitter.js'
import type { IRealtimeEmitter } from '@/application/_sharedApplication/notification/IRealtimeEmitter.js'
import type { Server as SocketIOServer } from 'socket.io'

export class RealtimeEmitterBootstrap {
    private static instance: IRealtimeEmitter | null = null

    /**
     * Socket.io Server 起動後に1回だけ呼ぶ
     */
    static initialize(io: SocketIOServer): void {
        if (this.instance) return
        this.instance = new SocketIoRealtimeEmitter(io)
    }

    /**
     * IRealtimeEmitter を取得する
     */
    static getEmitter(): IRealtimeEmitter {
        if (!this.instance) {
            throw new Error(
                'RealtimeEmitter is not initialized. Call RealtimeEmitterBootstrap.initialize(io) after Socket.io setup.'
            )
        }
        return this.instance
    }

    /**
     * テスト用: インスタンスをリセットする
     */
    static reset(): void {
        this.instance = null
    }

    /**
     * テスト用: カスタム実装を注入する
     */
    static setEmitter(emitter: IRealtimeEmitter): void {
        this.instance = emitter
    }
}
