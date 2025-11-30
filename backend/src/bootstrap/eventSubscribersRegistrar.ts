import { registerAuthDomainSubscribers } from '@/domains/auth/sharedAuth/domain/event/AuthDomainSubscribersRegistrar.js';
import { OutboxRepository } from '@/domains/sharedDomains/infrastructure/outbox/OutboxRepository.js';

export class DomainEventRegistrar {
    static registerAll() {
        const outboxRepo = new OutboxRepository();

        // 🔥 Auth のドメインイベント購読者登録
        registerAuthDomainSubscribers(outboxRepo);

        // ここに将来増える
        // registerReservationDomainSubscribers(outboxRepo)
        // registerMatchingDomainSubscribers(outboxRepo)
        // registerPaymentDomainSubscribers(outboxRepo)
    }
}
