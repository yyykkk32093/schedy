// test/e2e/eventSubscribersRegistrarForTest.ts

/**
 * テスト用 IntegrationDispatcher 登録。
 * audit.log / user.lifecycle.audit は TX内 INSERT に移行したため不要。
 * notification.push / webhook.line は本番と同じ registrar が登録するため、ここでは空。
 */
export class EventTestRegistrar {
    static registerAll(_app: any) {
        // audit.log は Outbox 経由ではなく TX 内 INSERT になったため登録不要
    }
}
