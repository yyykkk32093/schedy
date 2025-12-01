import { Activity } from "../model/entity/Activity.js";
import { ActivityId } from "../model/valueObject/ActivityId.js";

export interface IActivityRepository {
    save(activity: Activity): Promise<void>;
    update(activity: Activity): Promise<void>;
    findById(id: ActivityId): Promise<Activity | null>;
    findAll(): Promise<Activity[]>;
    delete(id: ActivityId): Promise<void>;
}
