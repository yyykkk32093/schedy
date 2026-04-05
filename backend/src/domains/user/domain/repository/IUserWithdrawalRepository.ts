/**
 * 退会理由リポジトリ（C-25）
 *
 * UserWithdrawal テーブルへの永続化を抽象化する。
 * 1ユーザーにつき最大1レコード（userId UNIQUE）。
 */
export interface IUserWithdrawalRepository {
    /** 退会理由を保存（既存があれば更新） */
    upsert(input: {
        userId: string
        reason: string
        freeText?: string | null
    }): Promise<void>
}
