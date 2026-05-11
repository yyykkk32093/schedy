import { usecaseFactory } from '@/api/_usecaseFactory.js'
import type { NextFunction, Request, Response } from 'express'

export const matchingController = {
    async generate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId
            const result = await usecaseFactory.createGenerateMatchingUseCase().execute({
                scheduleId,
                userId,
                mode: req.body.mode,
                rounds: req.body.rounds,
                courtCount: req.body.courtCount,
                groupsPerCourt: req.body.groupsPerCourt,
                playersPerGroup: req.body.playersPerGroup,
                categoryId: req.body.categoryId,
                categoryName: req.body.categoryName,
                formatName: req.body.formatName,
                fixedPairs: req.body.fixedPairs,
            })

            res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    },

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId
            const result = await usecaseFactory.createGetMatchingResultUseCase().execute({ scheduleId, userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async appendRounds(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId
            const result = await usecaseFactory.createAppendMatchingRoundsUseCase().execute({
                scheduleId,
                userId,
                addRounds: req.body.addRounds,
            })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId
            await usecaseFactory.createDeleteMatchingResultUseCase().execute({ scheduleId, userId })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async listCategoryMatchFormats(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId } = req.params
            const result = await usecaseFactory.createListCategoryMatchFormatsUseCase().execute({ communityId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async listParticipantLevels(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId
            const result = await usecaseFactory.createListParticipantLevelsUseCase().execute({ scheduleId, userId })
            res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    },

    async updateMemberLevel(req: Request, res: Response, next: NextFunction) {
        try {
            const { communityId, userId: targetUserId } = req.params
            const actorUserId = req.user!.userId
            await usecaseFactory.createUpdateMemberLevelMatchingUseCase().execute({
                communityId,
                targetUserId,
                actorUserId,
                level: req.body.level,
            })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async updateVisitorLevel(req: Request, res: Response, next: NextFunction) {
        try {
            const { participationId } = req.params
            const actorUserId = req.user!.userId
            await usecaseFactory.createUpdateVisitorLevelUseCase().execute({
                participationId,
                actorUserId,
                level: req.body.level,
            })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async updateFixedPairs(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId } = req.params
            const userId = req.user!.userId
            await usecaseFactory.createUpdateFixedPairsUseCase().execute({
                scheduleId,
                userId,
                fixedPairs: req.body.fixedPairs,
            })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },

    async updateRound(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: scheduleId, roundNo } = req.params
            const userId = req.user!.userId
            await usecaseFactory.createUpdateMatchingRoundUseCase().execute({
                scheduleId,
                userId,
                roundNo: Number(roundNo),
                round: { courts: req.body.courts },
            })
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    },
}
