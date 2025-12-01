import { prisma } from "@/sharedTech/db/client.js";
import { Activity } from "../../domain/model/entity/Activity.js";
import { IActivityRepository } from "../../domain/repository/IActivityRepository.js";

import { UserId } from "@/domains/sharedDomains/model/valueObject/UserId.js";
import { ActivityDescription } from "../../domain/model/valueObject/ActivityDescription.js";
import { ActivityId } from "../../domain/model/valueObject/ActivityId.js";
import { ActivityLocation } from "../../domain/model/valueObject/ActivityLocation.js";
import { ActivityTimeRange } from "../../domain/model/valueObject/ActivityTimeRange.js";
import { ActivityTitle } from "../../domain/model/valueObject/ActivityTitle.js";

import type { ActivityStatus } from "../../domain/model/entity/Activity.js";

export class ActivityRepositoryImpl implements IActivityRepository {

    // ============================================================
    // save（新規作成）
    // ============================================================
    async save(activity: Activity): Promise<void> {
        await prisma.activity.create({
            data: {
                id: activity.getId().getValue(),
                title: activity.getTitle().getValue(),
                description: activity.getDescription()?.getValue() ?? null,
                startAt: activity.getTimeRange().startAt,
                endAt: activity.getTimeRange().endAt,
                location: activity.getLocation()?.getValue() ?? null,
                createdBy: activity.getCreatedBy().getValue(),
                status: activity.getStatus(),
            },
        });
    }

    // ============================================================
    // update（更新）
    // ============================================================
    async update(activity: Activity): Promise<void> {
        await prisma.activity.update({
            where: { id: activity.getId().getValue() },
            data: {
                title: activity.getTitle().getValue(),
                description: activity.getDescription()?.getValue() ?? null,
                startAt: activity.getTimeRange().startAt,
                endAt: activity.getTimeRange().endAt,
                location: activity.getLocation()?.getValue() ?? null,
                status: activity.getStatus(),
            },
        });
    }

    // ============================================================
    // findById
    // ============================================================
    async findById(id: ActivityId): Promise<Activity | null> {
        const record = await prisma.activity.findUnique({
            where: { id: id.getValue() },
        });

        if (!record) return null;

        return Activity.reconstruct({
            id: ActivityId.create(record.id),
            title: ActivityTitle.create(record.title),
            description: record.description
                ? ActivityDescription.create(record.description)
                : null,
            timeRange: ActivityTimeRange.create(record.startAt, record.endAt),
            location: record.location
                ? ActivityLocation.create(record.location)
                : null,
            createdBy: new UserId(record.createdBy),
            status: record.status as ActivityStatus,
        });
    }

    // ============================================================
    // findAll
    // ============================================================
    async findAll(): Promise<Activity[]> {
        const rows = await prisma.activity.findMany({
            orderBy: { startAt: "asc" },
        });

        return rows.map((record) =>
            Activity.reconstruct({
                id: ActivityId.create(record.id),
                title: ActivityTitle.create(record.title),
                description: record.description
                    ? ActivityDescription.create(record.description)
                    : null,
                timeRange: ActivityTimeRange.create(record.startAt, record.endAt),
                location: record.location
                    ? ActivityLocation.create(record.location)
                    : null,
                createdBy: new UserId(record.createdBy),
                status: record.status as ActivityStatus,
            })
        );
    }

    // ============================================================
    // delete（キャンセルではなく物理削除）
    // ============================================================
    async delete(id: ActivityId): Promise<void> {
        await prisma.activity.delete({
            where: { id: id.getValue() },
        });
    }
}
