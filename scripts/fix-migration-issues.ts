// 临时脚本：修复数据库迁移问题
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function fixMigrationIssues() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL not set');
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    try {
        console.log('🔧 开始修复数据库迁移问题...\n');

        // 1. 修复 split_route_rules.conditions 列类型
        console.log('1. 修复 split_route_rules.conditions 列...');
        try {
            await db.execute(sql`
                ALTER TABLE split_route_rules 
                ALTER COLUMN conditions TYPE jsonb
                USING COALESCE(conditions::jsonb, '[]'::jsonb)
            `);
            console.log('   ✅ split_route_rules.conditions 已修复');
        } catch (e: any) {
            if (e.code === '42703') {
                console.log('   ⏭️  split_route_rules.conditions 列不存在，跳过');
            } else if (e.message?.includes('already') || e.code === '42P07') {
                console.log('   ⏭️  已经是 jsonb 类型，跳过');
            } else {
                console.log('   ⚠️  ', e.message);
            }
        }

        // 2. 创建 role_overrides 表（如果不存在）
        console.log('\n2. 创建 role_overrides 表...');
        try {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS role_overrides (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id),
                    role_code VARCHAR(50) NOT NULL,
                    added_permissions TEXT NOT NULL DEFAULT '[]',
                    removed_permissions TEXT NOT NULL DEFAULT '[]',
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_by UUID REFERENCES users(id)
                )
            `);
            console.log('   ✅ role_overrides 表已创建');
        } catch (e: any) {
            if (e.code === '42P07') {
                console.log('   ⏭️  role_overrides 表已存在，跳过');
            } else {
                console.log('   ⚠️  ', e.message);
            }
        }

        // 3. 创建索引（如果不存在）
        console.log('\n3. 创建 role_overrides 索引...');
        try {
            await db.execute(sql`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_role_overrides_tenant_role 
                ON role_overrides(tenant_id, role_code)
            `);
            console.log('   ✅ 索引已创建');
        } catch (e: any) {
            console.log('   ⚠️  ', e.message);
        }

        console.log('\n🎉 修复完成！请刷新页面测试权限矩阵。');

    } catch (error) {
        console.error('❌ 修复失败:', error);
    } finally {
        await client.end();
    }
}

fixMigrationIssues();
