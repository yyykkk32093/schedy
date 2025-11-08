// src/domains/domainShared/model/valueObject/UserId.ts

export class UserId {
    private readonly value: string;
  
    constructor(value: string) {
      if (!value || value.trim() === '') {
        throw new Error('UserId cannot be empty');
      }
      this.value = value;
    }
  
    getValue(): string {
      return this.value;
    }
  
    equals(other: UserId): boolean {
      return this.value === other.value;
    }
  }
  