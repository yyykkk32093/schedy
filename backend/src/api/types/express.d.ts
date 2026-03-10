/**
 * Express の Request 型を拡張し、認証ミドルウェアが設定する user プロパティの型安全性を確保する。
 */
declare namespace Express {
    interface Request {
        user?: {
            userId: string
            email: string
        }
    }
}
