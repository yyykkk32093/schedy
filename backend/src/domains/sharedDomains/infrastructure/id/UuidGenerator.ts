// src/domains/sharedDomains/infrastructure/id/UuidGenerator.ts
import { IIdGenerator } from '@/domains/sharedDomains/domain/service/IIdGenerator.js'
import crypto from 'crypto'

/**
 * 🔹 Node.js組み込みcryptoを利用したUUIDv4生成器。
 */
export class UuidGenerator implements IIdGenerator {
    generate(): string {
        return crypto.randomUUID()
    }
}
