// backend/eslint.config.js
//
// DDD レイヤ規約を機械的に強制するための ESLint Flat Config。
// 詳細な規約は backend/src/README.md を参照。
//
// 主なルール:
//  - api/** は Prisma 直 import 禁止（_usecaseFactory.ts と _bootstrap/** は除外）
//  - api/** は domains/**/infrastructure/** 直 import 禁止
//  - api/middleware/** は Prisma 直 import 禁止
//  - application/** は Express 関連 import 禁止
//  - domains/** は Express / Prisma 直 import 禁止（infrastructure/** は除外）
//
// 既存違反は対象ファイルで `// eslint-disable-next-line no-restricted-imports` を
// 付けて Phase 2 で順次解消する。
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const PRISMA_FORBIDDEN = {
    paths: [
        {
            name: '@prisma/client',
            message: 'このレイヤから Prisma 直 import は禁止です。Repository (UseCase 経由) を利用してください。',
        },
    ],
    patterns: [
        {
            group: ['**/_sharedTech/db/client*', '@/_sharedTech/db/client*'],
            message: 'このレイヤから prisma client 直 import は禁止です。Repository (UseCase 経由) を利用してください。',
        },
    ],
};

const EXPRESS_FORBIDDEN = {
    paths: [
        {
            name: 'express',
            message: 'このレイヤから Express の import は禁止です。HTTP 依存は api/ 層に閉じ込めてください。',
        },
    ],
};

const INFRASTRUCTURE_FORBIDDEN = {
    patterns: [
        {
            group: ['**/domains/**/infrastructure/**', '@/domains/**/infrastructure/**'],
            message: 'Repository 実装の直接 import は禁止です。_usecaseFactory.ts 経由で DI してください。',
        },
    ],
};

function merge(...rules) {
    return {
        paths: rules.flatMap((r) => r.paths ?? []),
        patterns: rules.flatMap((r) => r.patterns ?? []),
    };
}

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**', 'prisma/migrations/**', '**/*.d.ts'],
    },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            'no-empty': 'off',
            'no-useless-escape': 'off',
            'no-control-regex': 'off',
            'no-undef': 'off', // TS 側で型チェック済み
        },
    },
    // ===== api/** : Prisma 直 import 禁止 + Infrastructure 直 import 禁止 =====
    {
        files: ['src/api/**/*.{ts,tsx}'],
        ignores: [
            'src/api/_usecaseFactory.ts',
            'src/api/_bootstrap/**',
            // Composition root: アプリ起動時のみ DI コンテナ未経由で初期化が必要
            'src/api/server.ts',
            // 例外: 受信 webhook のシグネチャ検証など、ごく一部で必要な場合のみ
        ],
        rules: {
            'no-restricted-imports': ['error', merge(PRISMA_FORBIDDEN, INFRASTRUCTURE_FORBIDDEN)],
        },
    },
    // ===== application/** : Express import 禁止 + Infrastructure 直 import 禁止 =====
    {
        files: ['src/application/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': ['error', merge(EXPRESS_FORBIDDEN, INFRASTRUCTURE_FORBIDDEN)],
        },
    },
    // ===== domains/** (infrastructure 除く) : Express / Prisma 禁止 =====
    {
        files: ['src/domains/**/*.{ts,tsx}'],
        ignores: ['src/domains/**/infrastructure/**'],
        rules: {
            'no-restricted-imports': ['error', merge(PRISMA_FORBIDDEN, EXPRESS_FORBIDDEN)],
        },
    },
);
