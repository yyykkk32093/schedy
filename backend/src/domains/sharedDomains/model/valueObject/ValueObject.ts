/**
 * 全ての値オブジェクトの共通基底クラス。
 * - 不変性を保証
 * - 等価性比較(equals)
 * - 値の取り出し(getValue)
 * - 文字列表現(toString)
 */
export abstract class ValueObject<T> {
    protected readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

    /** 値を取り出す（業務ロジック用途） */
    public getValue(): T {
        return this.value;
    }

    /** 等価性比較 */
    public equals(other: ValueObject<T>): boolean {
        if (other === null || other === undefined) return false;
        return this.value === other.value;
    }

    /** 文字列化（ログや表示用） */
    public toString(): string {
        return String(this.value);
    }
}
