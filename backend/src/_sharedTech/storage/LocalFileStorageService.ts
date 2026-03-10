import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { IFileStorageService } from './IFileStorageService.js';

/**
 * ローカルファイルシステムへの保存実装（開発用）
 */
export class LocalFileStorageService implements IFileStorageService {
    private readonly uploadDir: string;
    private readonly baseUrl: string;

    constructor(uploadDir?: string, baseUrl?: string) {
        this.uploadDir = uploadDir ?? path.resolve(process.cwd(), 'uploads');
        this.baseUrl = baseUrl ?? `http://localhost:${process.env.PORT ?? 3001}/uploads`;
    }

    async upload(file: Express.Multer.File): Promise<{ url: string; key: string }> {
        await fs.mkdir(this.uploadDir, { recursive: true });

        const ext = path.extname(file.originalname);
        const key = `${Date.now()}-${crypto.randomUUID()}${ext}`;
        const dest = path.join(this.uploadDir, key);

        await fs.writeFile(dest, file.buffer);

        return {
            url: `${this.baseUrl}/${key}`,
            key,
        };
    }

    async delete(key: string): Promise<void> {
        const filePath = path.join(this.uploadDir, key);
        try {
            await fs.unlink(filePath);
        } catch {
            // ファイルが存在しない場合は無視
        }
    }
}
