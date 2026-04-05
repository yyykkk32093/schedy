import { UserId } from "@/domains/_sharedDomains/model/valueObject/UserId.js"
import { PasswordCredential } from "../model/entity/PasswordCredential.js"

export interface IPasswordCredentialRepository {
    findByUserId(userId: UserId): Promise<PasswordCredential | null>
    save(cred: PasswordCredential): Promise<void>
    deleteByUserId(userId: string): Promise<void>
}
