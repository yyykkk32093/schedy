import { AppSecretsLoader } from '@/_sharedTech/config/AppSecretsLoader.js';
import { prisma } from '@/_sharedTech/db/client.js';
import type { IFileStorageService } from '@/_sharedTech/storage/IFileStorageService.js';
import { S3FileStorageService } from '@/_sharedTech/storage/S3FileStorageService.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import { validateBody } from '@/api/middleware/validateBody.js';
import { attachmentConfirmSchema, attachmentPresignedUrlSchema, presignedUrlSchema, uploadConfirmSchema } from '@/api/schemas/index.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

/**
 * ストレージサービスの DI — LocalStack 一本化（LocalFileStorageService 廃止）
 */
function createStorageService(): IFileStorageService {
    const s3Config = AppSecretsLoader.getS3();
    return new S3FileStorageService(s3Config);
}

const storageService: IFileStorageService = createStorageService();

// ============================================================
// Presigned URL フロー — 汎用
// ============================================================

/**
 * POST /v1/upload/url
 * Presigned PUT URL を発行する
 */
router.post('/v1/upload/url', authMiddleware, validateBody(presignedUrlSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fileName, mimeType, fileSize } = req.body as {
            fileName?: string;
            mimeType?: string;
            fileSize?: number;
        };

        if (!fileName || !mimeType) {
            res.status(400).json({ code: 'INVALID_REQUEST', message: 'fileName, mimeType は必須です' });
            return;
        }

        if (fileSize && fileSize > 10 * 1024 * 1024) {
            res.status(400).json({ code: 'FILE_TOO_LARGE', message: 'ファイルサイズは 10MB 以下にしてください' });
            return;
        }

        const result = await storageService.generatePresignedUploadUrl(fileName, mimeType);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /v1/upload/confirm
 * クライアントが S3 アップロード完了後に呼び出す。オブジェクト存在確認。
 */
router.post('/v1/upload/confirm', authMiddleware, validateBody(uploadConfirmSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { key, fileName, mimeType, fileSize } = req.body as {
            key?: string;
            fileName?: string;
            mimeType?: string;
            fileSize?: number;
        };

        if (!key) {
            res.status(400).json({ code: 'INVALID_REQUEST', message: 'key は必須です' });
            return;
        }

        const exists = await storageService.objectExists(key);
        if (!exists) {
            res.status(404).json({ code: 'NOT_FOUND', message: 'アップロードされたファイルが見つかりません' });
            return;
        }

        const url = storageService.getPublicUrl(key);
        res.status(200).json({
            url,
            key,
            fileName: fileName ?? null,
            mimeType: mimeType ?? null,
            fileSize: fileSize ?? null,
        });
    } catch (err) {
        next(err);
    }
});

// ============================================================
// Presigned URL フロー — チャット添付ファイル
// ============================================================

/**
 * POST /v1/channels/:channelId/attachments/url
 * チャット添付用の Presigned PUT URL を発行
 */
router.post(
    '/v1/channels/:channelId/attachments/url',
    authMiddleware,
    validateBody(attachmentPresignedUrlSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { fileName, mimeType, fileSize } = req.body as {
                fileName?: string;
                mimeType?: string;
                fileSize?: number;
            };

            if (!fileName || !mimeType) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'fileName, mimeType は必須です' });
                return;
            }

            if (fileSize && fileSize > 10 * 1024 * 1024) {
                res.status(400).json({ code: 'FILE_TOO_LARGE', message: 'ファイルサイズは 10MB 以下にしてください' });
                return;
            }

            const result = await storageService.generatePresignedUploadUrl(fileName, mimeType);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /v1/channels/:channelId/messages/:messageId/attachments/confirm
 * チャット添付ファイルのアップロード完了確認 + DB 登録 + WebSocket 通知
 */
router.post(
    '/v1/channels/:channelId/messages/:messageId/attachments/confirm',
    authMiddleware,
    validateBody(attachmentConfirmSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const { channelId, messageId } = req.params;
            const { key, fileName, mimeType, fileSize } = req.body as {
                key?: string;
                fileName?: string;
                mimeType?: string;
                fileSize?: number;
            };

            if (!key) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'key は必須です' });
                return;
            }

            // メッセージ存在確認 & 送信者確認
            const message = await prisma.message.findUnique({ where: { id: messageId } });
            if (!message || message.channelId !== channelId) {
                res.status(404).json({ code: 'NOT_FOUND', message: 'メッセージが見つかりません' });
                return;
            }
            if (message.senderId !== userId) {
                res.status(403).json({ code: 'FORBIDDEN', message: '自分のメッセージにのみ添付できます' });
                return;
            }

            // S3 オブジェクト存在確認
            const exists = await storageService.objectExists(key);
            if (!exists) {
                res.status(404).json({ code: 'NOT_FOUND', message: 'アップロードされたファイルが見つかりません' });
                return;
            }

            const fileUrl = storageService.getPublicUrl(key);

            const attachment = await prisma.messageAttachment.create({
                data: {
                    messageId,
                    fileUrl,
                    fileName: fileName ?? 'unknown',
                    mimeType: mimeType ?? 'application/octet-stream',
                    fileSize: fileSize ?? 0,
                },
            });

            // WebSocket 通知
            const io = req.app.get('io');
            if (io) {
                io.to(`channel:${channelId}`).emit('message:attachment', {
                    messageId,
                    attachment: {
                        id: attachment.id,
                        fileUrl: attachment.fileUrl,
                        fileName: attachment.fileName,
                        mimeType: attachment.mimeType,
                        fileSize: attachment.fileSize,
                    },
                });
            }

            res.status(201).json(attachment);
        } catch (err) {
            next(err);
        }
    },
);

export default router;
