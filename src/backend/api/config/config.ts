import dotenvFlow from 'dotenv-flow';
import path from 'path';

// backend/env ディレクトリから .env ファイル群を読み込む
dotenvFlow.config({
    path: path.resolve(__dirname, '../../../env'),
});

export const config = {
    app: {
        port: Number(process.env.PORT) || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    db: {
        host: process.env.DB_HOST,
        name: process.env.DB_NAME,
    },
    security: {
        jwtSecret: process.env.JWT_SECRET,
        bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
    },
} as const;
