/**
 * IRealtimeEmitter
 *
 * アプリケーション層から WS リアルタイム配信を行うための抽象インターフェース。
 * Domain/Application 層は Socket.io の存在を知らない。
 *
 * - 実装: SocketIoRealtimeEmitter（API 層に配置）
 * - UseCase / NotificationService は本インターフェースを DI 注入して使う
 */
export interface IRealtimeEmitter {
    /**
     * 特定ユーザーにイベントを送信する
     * @param userId 送信先ユーザー ID
     * @param event イベント名（e.g. 'notification:new'）
     * @param payload イベントデータ
     */
    emitToUser(userId: string, event: string, payload: unknown): void

    /**
     * 特定チャンネルルームにイベントを送信する
     * @param channelId チャンネル ID
     * @param event イベント名（e.g. 'message:new'）
     * @param payload イベントデータ
     */
    emitToChannel(channelId: string, event: string, payload: unknown): void
}
