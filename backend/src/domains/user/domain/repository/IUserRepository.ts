import { User } from "../model/entity/User.js"


export interface IUserRepository {
    findById(id: string): Promise<User | null>
    findByIds(ids: string[]): Promise<User[]>
    findByEmail(email: string): Promise<User | null>
    save(user: User): Promise<void>
}
