/**
 * ファイルアップロード API クライアント — Presigned URL フロー
 *
 * 1. POST /v1/upload/url で署名付き URL を取得
 * 2. PUT で S3 に直接アップロード
 * 3. POST /v1/upload/confirm で存在確認 + 公開 URL 取得
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

interface PresignedUrlResponse {
    uploadUrl: string
    key: string
    publicUrl: string
}

/**
 * 汎用ファイルアップロード（Presigned URL フロー）
 *
 * @example
 * const result = await uploadFile(file)
 * // result.url → S3 / LocalStack のファイル URL
 */
export async function uploadFile(file: File): Promise<UploadResult> {
    // Step 1: Presigned URL を取得
    const urlRes = await fetch(`${baseURL}/v1/upload/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
        }),
        credentials: 'include',
    })

    if (!urlRes.ok) {
        const body = await urlRes.json().catch(() => null)
        const apiError: ApiError =
            body && typeof body === 'object' && 'code' in body
                ? (body as ApiError)
                : { code: 'UPLOAD_ERROR', message: `Failed to get upload URL: HTTP ${urlRes.status}` }
        throw new HttpError(urlRes.status, apiError)
    }

    const { uploadUrl, key } = (await urlRes.json()) as PresignedUrlResponse

    // Step 2: S3 に直接アップロード
    const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
    })

    if (!putRes.ok) {
        throw new HttpError(putRes.status, {
            code: 'UPLOAD_ERROR',
            message: `S3 upload failed: HTTP ${putRes.status}`,
        })
    }

    // Step 3: 確認 + 公開 URL 取得
    const confirmRes = await fetch(`${baseURL}/v1/upload/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
        }),
        credentials: 'include',
    })

    if (!confirmRes.ok) {
        const body = await confirmRes.json().catch(() => null)
        const apiError: ApiError =
            body && typeof body === 'object' && 'code' in body
                ? (body as ApiError)
                : { code: 'UPLOAD_ERROR', message: `Upload confirm failed: HTTP ${confirmRes.status}` }
        throw new HttpError(confirmRes.status, apiError)
    }

    const confirmed = await confirmRes.json()
    return confirmed as UploadResult
}
