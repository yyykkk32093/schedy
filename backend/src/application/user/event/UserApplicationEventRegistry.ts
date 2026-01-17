import { ApplicationEventBus } from '@/application/_sharedApplication/event/ApplicationEventBus.js'

/**
 * User の ApplicationEvent 購読者登録
 * - in-process の副作用（ログ/メトリクス等）をここに集約する
 */
export function registerUserApplicationSubscribers(params: {
    appEventBus: ApplicationEventBus
}) {
    void params
}
