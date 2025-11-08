// src/domains/auth/authShared/model/valueObject/HashedPassword.ts

export class HashedPassword {
    private readonly _value: string;

    constructor(value: string) {
        if (!value || (!value.startsWith('$2a$') && !value.startsWith('$2b$'))) {
            throw new Error('Invalid hashed password format');
        }
        this._value = value;
    }

    get value(): string {
        return this._value;
    }

    /**
     * 値オブジェクト同士の等価性比較
     */
    equals(other: HashedPassword): boolean {
        if (!other) return false;
        return this._value === other.value;
    }
}
