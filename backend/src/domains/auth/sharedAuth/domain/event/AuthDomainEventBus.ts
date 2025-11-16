// src/domains/auth/password/domain/event/AuthDomainEventBus.ts
import { PasswordUserLoggedInEvent } from '@/domains/auth/password/domain/event/PasswordUserLoggedInEvent.js'
import { PasswordUserLoginFailedEvent } from '@/domains/auth/password/domain/event/PasswordUserLoginFailedEvent.js'
import { DomainEventBus } from '@/domains/sharedDomains/domain/event/DomainEventBus.js'

// Authドメインで扱うイベント型
export type AuthDomainEvents =
    | PasswordUserLoggedInEvent
    | PasswordUserLoginFailedEvent

// Auth専用Bus
export const authDomainEventBus = new DomainEventBus<AuthDomainEvents>()
