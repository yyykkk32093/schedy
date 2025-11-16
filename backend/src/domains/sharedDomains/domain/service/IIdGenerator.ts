// src/domains/sharedDomains/domain/service/IIdGenerator.ts
/**
 * 🔹 一意な識別子を生成するための抽象サービス。
 * ドメイン層では技術的な生成手段を意識しない。
 */
export interface IIdGenerator {
    generate(): string
}
