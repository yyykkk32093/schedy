/**
 * ファイルアップロード API クライアント
 *
 * バックエンドの POST /v1/upload に multipart/form-data でファイルを送信し、
 * アップロード結果（URL, key）を返す。
 */

import { HttpError, type ApiError } from '@/shared/lib/apiClient'

const baseURL: string = import.meta.env.VITE_API_BASE_URL || ''

export interface UploadResult {
    url: string
    key: string
    fileName: string
    mimeType: string
    fileSize: number
}

/**
 * 汎用ファイルアップロード
 *
 * @example
 * const result = await uploadFile(file)
 * // result.url → S3 / LocalStack のファイル URL
 */
export async function uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${baseURL}/v1/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
    })

    const body = await res.json()

    if (!res.ok) {
        const apiError: ApiError =
            body && typeof body === 'object' && 'code' in body
                ? (body as ApiError)
                : { code: 'UPLOAD_ERROR', message: `Upload failed: HTTP ${res.status}` }
        throw new HttpError(res.status, apiError)
    }

    return body as UploadResult
}
