import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

type LoadEnvOptions = {
    envDir: string
}

/**
 * backend/env 配下の .env ファイル群を読み込む。
 *
 * 優先順位（後勝ち / ただし既存 process.env は上書きしない）
 * - .env.shared
 * - .env.{NODE_ENV}
 * - .env.local
 * - .env.{NODE_ENV}.local
 */
export function loadEnv(options: LoadEnvOptions) {
    const envDir = options.envDir
    const nodeEnv = process.env.NODE_ENV || 'development'

    const candidates = [
        '.env.shared',
        `.env.${nodeEnv}`,
        '.env.local',
        `.env.${nodeEnv}.local`,
    ]

    const merged: Record<string, string> = {}

    for (const fileName of candidates) {
        const fullPath = path.join(envDir, fileName)
        if (!fs.existsSync(fullPath)) {
            continue
        }

        const content = fs.readFileSync(fullPath)
        const parsed = dotenv.parse(content)
        Object.assign(merged, parsed)
    }

    for (const [key, value] of Object.entries(merged)) {
        // 既に実行環境から渡されているものは尊重する
        if (process.env[key] === undefined) {
            process.env[key] = value
        }
    }

    return {
        nodeEnv,
        loadedFiles: candidates.filter((fileName) =>
            fs.existsSync(path.join(envDir, fileName))
        ),
    } as const
}
