/**
 * ファイルストレージサービスのインターフェース
 * Phase 2: ローカルファイルシステム
 * Phase 3+: S3 等のクラウドストレージへ差し替え
 */
export interface IFileStorageService {
    /**
     * ファイルを保存し、アクセスURLを返す
     */
    upload(file: Express.Multer.File): Promise<{ url: string; key: string }>;

    /**
     * ファイルを削除する
     */
    delete(key: string): Promise<void>;
}
