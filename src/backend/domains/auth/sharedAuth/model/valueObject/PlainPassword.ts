// src/domains/auth/authShared/model/valueObject/PlainPassword.ts

/**
 * 平文パスワードの値オブジェクト。
 * - 不変であること
 * - 同じ値なら同一とみなせること
 */
export class PlainPassword {
    private readonly _value: string;

    constructor(value: string) {
        if (!value || value.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        this._value = value;
    }

    get value(): string {
        return this._value;
    }

    /**
     * 値オブジェクト同士の等価性比較
     */
    equals(other: PlainPassword): boolean {
        if (!other) return false;
        return this._value === other.value;
    }
}
