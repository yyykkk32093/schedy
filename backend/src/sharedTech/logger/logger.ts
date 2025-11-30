// src/sharedTech/logger/logger.ts

import pino from "pino";

/**
 * ログ設定
 * - development: pretty print（人間が見やすい）
 * - production: JSON（機械が解析しやすい）
 */

const isProduction = process.env.NODE_ENV === "production"

// LOG_LEVEL 指定がある場合は最優先
// 指定が無い場合：本番→info / それ以外→debug
const logLevel =
    process.env.LOG_LEVEL ||
    (isProduction ? "info" : "debug")

export const logger = pino({
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime, // ISO8601
    base: {
        //   service: "backend",
        env: process.env.NODE_ENV,
    },
    transport: !isProduction
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
            },
        }
        : undefined,
})

// logLevel
// level	numeric
// fatal	60
// error	50
// warn	40
// info	30 ← これがデフォルト
// debug	20
// trace	10

// 🟩 ログレベルの意味（あなたの Worker に最適な使い方）
// level	意味	Workerでの例
// fatal	アプリ落ちる	unexpected shutdown
// error	リトライ不可能 / 予期せぬ失敗	dispatch error, DB error
// warn	リトライ予定 / 予約された失敗	retry scheduling
// info	正常動作	published, started
// debug	ローカルのみ	payload dump
// trace	最詳細	Repository-level query