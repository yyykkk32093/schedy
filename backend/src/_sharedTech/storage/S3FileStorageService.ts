import {
    DeleteObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';
import path from 'node:path';
import type { IFileStorageService, PresignedUploadResult } from './IFileStorageService.js';

/**
 * S3FileStorageService — AWS S3 / LocalStack S3 へのファイル保存実装
 *
 * Presigned URL によるクライアント直接アップロードをサポート。
 * ローカル開発では LocalStack S3 を使用する。
 */
export class S3FileStorageService implements IFileStorageService {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicBaseUrl: string;

    /** Presigned URL の有効期限（秒） */
    private static readonly PRESIGNED_URL_EXPIRES_IN = 300; // 5分

    constructor(config: {
        bucket: string;
        region: string;
        endpoint?: string;
        forcePathStyle?: boolean;
    }) {
        this.bucket = config.bucket;

        const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
            region: config.region,
        };

        // LocalStack 用: カスタムエンドポイント
        if (config.endpoint) {
            clientConfig.endpoint = config.endpoint;
            clientConfig.forcePathStyle = config.forcePathStyle ?? true;
        }

        this.client = new S3Client(clientConfig);

        // 公開URL: LocalStack の場合は endpoint/bucket、S3 の場合は標準URL
        this.publicBaseUrl = config.endpoint
            ? `${config.endpoint}/${this.bucket}`
            : `https://${this.bucket}.s3.${config.region}.amazonaws.com`;
    }

    // ─── Presigned URL フロー ─────────────────────────────

    async generatePresignedUploadUrl(
        fileName: string,
        contentType: string,
    ): Promise<PresignedUploadResult> {
        const ext = path.extname(fileName);
        const key = `${Date.now()}-${crypto.randomUUID()}${ext}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(this.client, command, {
            expiresIn: S3FileStorageService.PRESIGNED_URL_EXPIRES_IN,
        });

        return {
            uploadUrl,
            key,
            publicUrl: `${this.publicBaseUrl}/${key}`,
        };
    }

    async objectExists(key: string): Promise<boolean> {
        try {
            await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            return true;
        } catch {
            return false;
        }
    }

    getPublicUrl(key: string): string {
        return `${this.publicBaseUrl}/${key}`;
    }

    // ─── 既存メソッド ─────────────────────────────────────

    /**
     * @deprecated Presigned URL 移行完了後に削除予定
     */
    async upload(file: Express.Multer.File): Promise<{ url: string; key: string }> {
        const ext = path.extname(file.originalname);
        const key = `${Date.now()}-${crypto.randomUUID()}${ext}`;

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }),
        );

        return {
            url: `${this.publicBaseUrl}/${key}`,
            key,
        };
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
        } catch {
            // オブジェクトが存在しない場合は無視
        }
    }
}
