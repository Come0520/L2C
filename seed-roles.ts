/**
 * 预置角色种子脚本
 * 将 shared/config/roles.ts 中的硬编码角色同步到数据库 roles 表
 * 
 * 执行命令: npx tsx seed-roles.ts
 */

import 'dotenv/config';
import { db } from './src/shared/api/db';
import { roles, tenants } from './src/shared/api/schema';
import { ROLES } from './src/shared/config/roles';
import { eq } from 'drizzle-orm';

async function seedRoles() {
    console.log('🔧 开始同步预置角色到数据库...\n');

    // 1. 获取所有租户
    const allTenants = await db.select({ id: tenants.id, name: tenants.name }).from(tenants);

    if (allTenants.length === 0) {
        console.log('⚠️  没有找到任何租户，请先创建租户');
        return;
    }

    console.log(`📋 找到 ${allTenants.length} 个租户\n`);

    let totalCreated = 0;
    let totalSkipped = 0;

    // 2. 为每个租户初始化预置角色
    for (const tenant of allTenants) {
        console.log(`👉 处理租户: ${tenant.name} (${tenant.id})`);

        for (const [code, roleDef] of Object.entries(ROLES)) {
            // 检查是否已存在
            const existing = await db.query.roles.findFirst({
                where: eq(roles.code, code),
            });

            if (existing) {
                console.log(`   ⏭️  ${roleDef.name} (${code}) - 已存在，跳过`);
                totalSkipped++;
                continue;
            }

            // 插入新角色
            await db.insert(roles).values({
                tenantId: tenant.id,
                code,
                name: roleDef.name,
                description: roleDef.description,
                permissions: roleDef.permissions,
                isSystem: true, // 标记为系统预置
            });

            console.log(`   ✅ ${roleDef.name} (${code}) - 已创建`);
            totalCreated++;
        }

        console.log('');
    }

    console.log('✨ 同步完成!');
    console.log(`   - 新建: ${totalCreated} 个角色`);
    console.log(`   - 跳过: ${totalSkipped} 个角色`);
}

seedRoles()
    .then(() => {
        console.log('\n🎉 种子脚本执行成功');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    });
