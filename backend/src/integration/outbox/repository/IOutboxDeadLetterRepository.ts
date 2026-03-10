import { IntegrationError } from "@/integration/error/IntegrationError.js";
import { OutboxEvent } from "../model/entity/OutboxEvent.js";

export interface IOutboxDeadLetterRepository {
    save(event: OutboxEvent, error: IntegrationError): Promise<void>;
}
