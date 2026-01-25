import jwt from 'jsonwebtoken'

export class JwtTokenService {
    constructor(private readonly secret: string) { }

    generate(userId: string, email?: string | null): string {
        const payload: Record<string, unknown> = {
            sub: userId,
        }

        if (email) {
            payload.email = email
        }

        return jwt.sign(payload, this.secret, { expiresIn: '7d' })
    }

    verify(token: string): any {
        return jwt.verify(token, this.secret)
    }
}
