/**
 * 邀请系统改进 - 数据库迁移脚本
 * 
 * 执行内容：
 * 1. email 字段改为可空
 * 2. 移除全局唯一约束，添加租户级复合唯一约束
 * 3. phone 字段改为必填
 * 4. 确保 invitations 表存在
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
    console.log('开始执行邀请系统数据库迁移...\n');

    try {
        // 1. email 改可空
        console.log('1. 将 email 字段改为可空...');
        await sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`;
        console.log('✓ email 字段已改为可空\n');

        // 2. 移除旧的全局唯一约束
        console.log('2. 移除旧的全局唯一约束...');
        await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique`;
        await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_unique`;
        console.log('✓ 旧约束已移除\n');

        // 3. phone 改非空（先清理可能的空值）
        console.log('3. 将 phone 字段改为必填...');
        const nullPhones = await sql`SELECT id FROM users WHERE phone IS NULL`;
        if (nullPhones.length > 0) {
            console.log(`  发现 ${nullPhones.length} 条记录的 phone 为空，正在修复...`);
            await sql`UPDATE users SET phone = 'UNKNOWN_' || id WHERE phone IS NULL`;
        }
        await sql`ALTER TABLE users ALTER COLUMN phone SET NOT NULL`;
        console.log('✓ phone 字段已改为必填\n');

        // 4. 添加复合唯一约束
        console.log('4. 添加租户级复合唯一约束...');
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_phone ON users(tenant_id, phone)`;
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email) WHERE email IS NOT NULL`;
        console.log('✓ 复合唯一索引已创建\n');

        // 5. 确保 invitations 表存在
        console.log('5. 检查并创建 invitations 表...');
        await sql`
      CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        inviter_id UUID NOT NULL REFERENCES users(id),
        code VARCHAR(10) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        max_uses VARCHAR(10) DEFAULT '1',
        used_count VARCHAR(10) DEFAULT '0',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
        console.log('✓ invitations 表已就绪\n');

        console.log('✅ 数据库迁移完成！');
    } catch (error) {
        console.error('❌ 迁移失败:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

migrate();
