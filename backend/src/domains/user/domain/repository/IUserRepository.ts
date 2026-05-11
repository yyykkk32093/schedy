import { User } from "../model/entity/User.js"

/**
 * システム権限の判定に必要な最小限のビュー（DTO）。
 * 認可ミドルウェア用途のため、Entity を使わずに薄く返す。
 * Phase 2 [202603_08]: middleware の Prisma 直叩き解消のため新設。
 */
export type SystemAuthorizationView = {
    systemRole: 'USER' | 'OPERATOR' | 'SUPER_ADMIN' | string
    isDeleted: boolean
}

/**
 * Feature Gate 判定に必要な最小限のビュー（DTO）。
 * Phase 2 [202603_08]: featureGateMiddleware の Prisma 直叩き解消のため新設。
 */
export type UserPlanView = {
    plan: string
}

/**
 * /v1/auth/me で返却するための薄いビュー。
 * Phase 2 [202603_08]: sessionRoutes の Prisma 直叩き解消のため新設。
 */
export type AuthMeView = {
    id: string
    plan: string
    displayName: string | null
    email: string | null
    avatarUrl: string | null
    systemRole: string
}

export interface IUserRepository {
    findById(id: string): Promise<User | null>
    findByIds(ids: string[]): Promise<User[]>
    findByEmail(email: string): Promise<User | null>
    save(user: User): Promise<void>

    /**
     * 認可判定用に systemRole と削除状態のみを取得する。
     * 存在しない場合は null。
     */
    findSystemAuthorization(id: string): Promise<SystemAuthorizationView | null>

    /**
     * Feature Gate 判定用に plan のみを取得する。
     * 存在しない場合は null。
     */
    findPlan(id: string): Promise<UserPlanView | null>

    /**
     * /v1/auth/me 用に、認証セッション周りで必要な薄いビューを返す。
     */
    findAuthMeView(id: string): Promise<AuthMeView | null>

    /**
     * ユーザーの locale 設定を取得する。未設定なら null。
     */
    findLocale(id: string): Promise<{ locale: string | null } | null>

    /**
     * ユーザーの locale 設定を更新する。
     */
    updateLocale(id: string, locale: string | null): Promise<void>

    /**
     * チャット送信時の表示用プロファイル（軽量）。存在しない場合は null。
     */
    findChatSenderProfile(id: string): Promise<{ displayName: string | null; avatarUrl: string | null } | null>

    /**
     * SystemAdmin (OPERATOR / SUPER_ADMIN) であることを問い合わせ担当者割当用に検証する。
     */
    findSystemAdminForAssignee(id: string): Promise<{ id: string; systemRole: string; deletedAt: Date | null } | null>

    /**
     * SystemAdmin ユーザー一覧（問い合わせ担当割当プルダウン用）。
     */
    listSystemAdmins(): Promise<Array<{ id: string; displayName: string | null; email: string | null; systemRole: string }>>
}
