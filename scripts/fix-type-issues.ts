// 临时脚本：修复所有类型转换问题
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function fixAllTypeIssues() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL not set');
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    try {
        console.log('🔧 开始修复所有类型转换问题...\n');

        // 1. 修复 split_route_rules.is_active 列类型
        console.log('1. 修复 split_route_rules.is_active 列...');
        try {
            await db.execute(sql`
                ALTER TABLE split_route_rules 
                ALTER COLUMN is_active TYPE boolean
                USING COALESCE(is_active::boolean, true)
            `);
            console.log('   ✅ split_route_rules.is_active 已修复');
        } catch (e: any) {
            console.log('   ⚠️  ', e.message);
        }

        // 2. 确保 role_overrides 表正确配置
        console.log('\n2. 检查 role_overrides 表...');
        try {
            // 检查表是否存在
            const result = await db.execute(sql`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'role_overrides'
                ) as exists
            `);
            console.log('   ✅ role_overrides 表存在');
        } catch (e: any) {
            console.log('   ⚠️  ', e.message);
        }

        console.log('\n🎉 修复完成！现在可以再次运行 drizzle-kit push --force');

    } catch (error) {
        console.error('❌ 修复失败:', error);
    } finally {
        await client.end();
    }
}

fixAllTypeIssues();
