/**
 * ファイルストレージサービスのインターフェース
 *
 * Presigned URL フロー:
 *   1. FE → BE: POST /v1/upload/url { fileName, mimeType, fileSize }
 *   2. BE: generatePresignedUploadUrl() → { uploadUrl, key, publicUrl }
 *   3. FE → S3: PUT uploadUrl (ファイル本体)
 *   4. FE → BE: POST /v1/upload/confirm { key }
 *   5. BE: objectExists() で検証 → { url, key, ... }
 */

export interface PresignedUploadResult {
    /** S3 へ直接 PUT するための署名付き URL */
    uploadUrl: string
    /** 生成されたオブジェクトキー */
    key: string
    /** アップロード完了後の公開 URL */
    publicUrl: string
}

export interface IFileStorageService {
    /**
     * Presigned PUT URL を生成する
     */
    generatePresignedUploadUrl(
        fileName: string,
        contentType: string,
    ): Promise<PresignedUploadResult>

    /**
     * オブジェクトが存在するか確認する（confirm 用）
     */
    objectExists(key: string): Promise<boolean>

    /**
     * キーから公開 URL を取得する
     */
    getPublicUrl(key: string): string

    /**
     * ファイルを削除する
     */
    delete(key: string): Promise<void>

    /**
     * @deprecated Presigned URL 移行完了後に削除予定
     * サーバーサイドアップロード（後方互換用）
     */
    upload(file: Express.Multer.File): Promise<{ url: string; key: string }>
}
