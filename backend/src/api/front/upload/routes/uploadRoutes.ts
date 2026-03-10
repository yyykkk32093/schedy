import { AppSecretsLoader } from '@/_sharedTech/config/AppSecretsLoader.js';
import { prisma } from '@/_sharedTech/db/client.js';
import type { IFileStorageService } from '@/_sharedTech/storage/IFileStorageService.js';
import { LocalFileStorageService } from '@/_sharedTech/storage/LocalFileStorageService.js';
import { S3FileStorageService } from '@/_sharedTech/storage/S3FileStorageService.js';
import { authMiddleware } from '@/api/middleware/authMiddleware.js';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * ストレージサービスの DI
 * S3_BUCKET 環境変数が設定されていれば S3 を使用、なければローカルファイルシステム
 */
function createStorageService(): IFileStorageService {
    try {
        const s3Config = AppSecretsLoader.getS3();
        if (s3Config.bucket) {
            return new S3FileStorageService(s3Config);
        }
    } catch {
        // AppSecrets 未ロード時はローカルにフォールバック
    }
    return new LocalFileStorageService();
}

const storageService: IFileStorageService = createStorageService();

/**
 * POST /v1/channels/:channelId/messages/:messageId/attachments
 * メッセージに添付ファイルをアップロード
 */
router.post(
    '/v1/channels/:channelId/messages/:messageId/attachments',
    authMiddleware,
    upload.single('file'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;
            const { channelId, messageId } = req.params;
            const file = req.file;

            if (!file) {
                res.status(400).json({ code: 'INVALID_REQUEST', message: 'ファイルが必要です' });
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

            // ファイル保存
            const { url, key } = await storageService.upload(file);

            const attachment = await prisma.messageAttachment.create({
                data: {
                    messageId,
                    fileUrl: url,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    fileSize: file.size,
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

/**
 * POST /v1/upload
 * 汎用ファイルアップロード（プロフ画像・スタンプ画像等）
 */
router.post('/v1/upload', authMiddleware, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ code: 'INVALID_REQUEST', message: 'ファイルが必要です' });
            return;
        }

        const { url, key } = await storageService.upload(file);
        res.status(201).json({ url, key, fileName: file.originalname, mimeType: file.mimetype, fileSize: file.size });
    } catch (err) {
        next(err);
    }
});

export default router;
