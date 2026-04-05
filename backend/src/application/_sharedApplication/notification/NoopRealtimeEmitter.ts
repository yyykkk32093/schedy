import type { IRealtimeEmitter } from './IRealtimeEmitter.js';

/**
 * NoopRealtimeEmitter — WS 配信をスキップするダミー実装
 *
 * Worker プロセスなど Socket.io が利用不可な環境で使用する。
 * NotificationService に注入することで、WS emit を空振りさせる。
 */
export class NoopRealtimeEmitter implements IRealtimeEmitter {
    emitToUser(_userId: string, _event: string, _payload: unknown): void {
        // noop
    }

    emitToChannel(_channelId: string, _event: string, _payload: unknown): void {
        // noop
    }
}
