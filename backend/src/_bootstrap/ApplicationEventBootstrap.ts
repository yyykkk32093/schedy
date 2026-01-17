// src/bootstrap/applicationEventBootstrap.ts
import { ApplicationEventBus } from '@/application/_sharedApplication/event/ApplicationEventBus.js'
import { registerAuthApplicationSubscribers } from '@/application/auth/event/AuthApplicationEventRegistry.js'
import { registerUserApplicationSubscribers } from '@/application/user/event/UserApplicationEventRegistry.js'

export class ApplicationEventBootstrap {
    private static appEventBus: ApplicationEventBus | null = null

    /**
     * 起動時に1回だけ呼ぶ
     */
    static bootstrap(): void {
        if (this.appEventBus) {
            return
        }

        const appEventBus = new ApplicationEventBus()

        registerAuthApplicationSubscribers({
            appEventBus,
        })

        registerUserApplicationSubscribers({
            appEventBus,
        })

        this.appEventBus = appEventBus
    }

    /**
     * どこからでも参照用
     */
    static getEventBus(): ApplicationEventBus {
        if (!this.appEventBus) {
            throw new Error(
                'ApplicationEventBus is not initialized. Call ApplicationEventBootstrap.bootstrap() first.'
            )
        }
        return this.appEventBus
    }
}
