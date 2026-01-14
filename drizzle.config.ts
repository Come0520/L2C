import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required. Please ensure Docker Postgres is running and .env.local is configured.');
}

export default defineConfig({
    // Schema 文件路径
    schema: './src/shared/api/schema.ts',

    // 迁移文件输出目录
    out: './drizzle',

    // 数据库类型
    dialect: 'postgresql',

    // 数据库连接配置
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },

    // 详细日志
    verbose: true,

    // 严格模式
    strict: true,
});
