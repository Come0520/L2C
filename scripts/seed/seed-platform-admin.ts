/**
 * 创建平台超级管理员账户
 * 
 * 使用方式:
 * npx tsx scripts/seed/seed-platform-admin.ts
 */
import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedPlatformAdmin() {
    console.log('🚀 开始创建平台超级管理员...');

    // 配置信息
    const ADMIN_PHONE = '15601911921';
    const ADMIN_PASSWORD = 'I@l2c2026';
    const ADMIN_NAME = '平台管理员';
    const ADMIN_EMAIL = 'admin@l2c.com';

    try {
        // 1. 检查是否已存在
        const existing = await db.query.users.findFirst({
            where: eq(users.phone, ADMIN_PHONE),
        });

        if (existing) {
            // 更新为平台管理员
            await db.update(users)
                .set({
                    isPlatformAdmin: true,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, existing.id));

            console.log(`✅ 已将现有用户 (${ADMIN_PHONE}) 设置为平台管理员`);
            return;
        }

        // 2. 创建一个系统租户（用于平台管理员）
        let systemTenant = await db.query.tenants.findFirst({
            where: eq(tenants.code, 'SYSTEM'),
        });

        if (!systemTenant) {
            const [newTenant] = await db.insert(tenants).values({
                name: 'L2C 平台',
                code: 'SYSTEM',
                status: 'active',
                isActive: true,
            }).returning();
            systemTenant = newTenant;
            console.log('📦 已创建系统租户 SYSTEM');
        }

        // 3. 创建平台管理员账户
        const passwordHash = await hash(ADMIN_PASSWORD, 12);

        await db.insert(users).values({
            tenantId: systemTenant.id,
            name: ADMIN_NAME,
            phone: ADMIN_PHONE,
            email: ADMIN_EMAIL,
            passwordHash,
            role: 'ADMIN',
            isPlatformAdmin: true,
            isActive: true,
            permissions: [],
        });

        console.log('✅ 平台超级管理员创建成功!');
        console.log(`   手机号: ${ADMIN_PHONE}`);
        console.log(`   密码: ${ADMIN_PASSWORD}`);
        console.log(`   登录后访问: /admin/tenants`);

    } catch (error) {
        console.error('❌ 创建失败:', error);
        process.exit(1);
    }

    process.exit(0);
}

seedPlatformAdmin();
