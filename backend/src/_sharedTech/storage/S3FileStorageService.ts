import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import path from 'node:path';
import type { IFileStorageService } from './IFileStorageService.js';

/**
 * S3FileStorageService — AWS S3 / LocalStack S3 へのファイル保存実装
 *
 * ローカル開発では LocalStack S3 を使用する。
 * production では実 S3 を使用する。
 */
export class S3FileStorageService implements IFileStorageService {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicBaseUrl: string;

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
