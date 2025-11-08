// EmailAddress.ts
export class EmailAddress {
    private readonly value: string;

    constructor(value: string) {
        if (!EmailAddress.isValid(value)) {
            throw new Error('Invalid email address');
        }
        this.value = value;
    }

    static isValid(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: EmailAddress): boolean {
        return this.value === other.value;
    }
}
