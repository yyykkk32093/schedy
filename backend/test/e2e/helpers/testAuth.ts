// test/e2e/helpers/testAuth.ts
import { JwtTokenService } from '@/_sharedTech/security/JwtTokenService.js'

const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
const jwtService = new JwtTokenService(jwtSecret)

/**
 * テスト用 JWT トークンを生成する
 */
export function generateTestToken(userId: string, email?: string): string {
    return jwtService.generate(userId, email)
}

/**
 * supertest の Authorization ヘッダー値を生成する
 */
export function bearerToken(userId: string, email?: string): string {
    return `Bearer ${generateTestToken(userId, email)}`
}
