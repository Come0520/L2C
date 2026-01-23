import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

/**
 * 修复 quote_status 枚举问题
 * 将 SUBMITTED 值重命名为 _DEPRECATED_SUBMITTED
 */
async function fixQuoteStatusEnum() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ 缺少 DATABASE_URL 环境变量');
        process.exit(1);
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    try {
        console.log('开始修复 quote_status 枚举...');

        // PostgreSQL 14+ 支持直接重命名枚举值
        await db.execute(sql`ALTER TYPE quote_status RENAME VALUE 'SUBMITTED' TO '_DEPRECATED_SUBMITTED'`);

        console.log('✅ 枚举修复完成！');
        console.log('现在可以运行 pnpm db:push');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('does not exist')) {
            console.log('✅ SUBMITTED 值已不存在，无需修复');
        } else {
            console.error('❌ 修复失败:', errorMessage);
        }
    } finally {
        await client.end();
    }
    process.exit(0);
}

fixQuoteStatusEnum();
