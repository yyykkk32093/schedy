export interface IOutboxDeadLetterRepository {
    save(event: any, error: unknown): Promise<void>;
}
