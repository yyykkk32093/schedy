// src/domains/_sharedDomains/domain/model/valueObject/AuthMethod.ts

/**
 * 認証方式（ドメイン概念）
 *
 * ユーザー登録時に使用された認証方式を表す。
 * auth ドメインと user ドメインの共通概念のため shared に配置。
 *
 * - password : パスワード認証
 * - line     : LINE OAuth
 * - apple    : Apple Sign In
 * - google   : Google OAuth
 */
export type AuthMethod =
    | 'password'
    | 'line'
    | 'apple'
    | 'google'
