/**
 * 临时脚本：创建本地测试账号
 * 手机号: 15601911921 / 密码: 123456
 */
import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { tenants, users, tenantMembers } from '../src/shared/api/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const TEST_PHONE = '15601911921';
const TEST_PASSWORD = '123456';

async function createTestUser() {
    console.log('🔧 创建测试账号...');

    try {
        // 1. 获取第一个租户
        let tenant = await db.query.tenants.findFirst({
            where: eq(tenants.status, 'active'),
        });

        if (!tenant) {
            const [newTenant] = await db
                .insert(tenants)
                .values({
                    name: '测试公司',
                    code: 'TEST-LOCAL',
                    status: 'active',
                    planType: 'enterprise',
                    isGrandfathered: true,
                })
                .returning();
            tenant = newTenant;
            console.log(`  ✅ 创建新租户: ${tenant.id}`);
        } else {
            console.log(`  ✅ 使用已有租户: ${tenant.name} (${tenant.id})`);
        }

        // 2. 创建或更新用户
        const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
        let user = await db.query.users.findFirst({
            where: eq(users.phone, TEST_PHONE),
        });

        if (!user) {
            const [newUser] = await db
                .insert(users)
                .values({
                    tenantId: tenant.id,
                    phone: TEST_PHONE,
                    name: '测试管理员',
                    passwordHash,
                    role: 'ADMIN',
                    isActive: true,
                    isPlatformAdmin: false,
                    lastActiveTenantId: tenant.id,
                })
                .returning();
            user = newUser;
            console.log(`  ✅ 创建新用户: ${user.id}`);
        } else {
            await db
                .update(users)
                .set({ passwordHash, role: 'ADMIN', isActive: true, tenantId: tenant.id })
                .where(eq(users.id, user.id));
            console.log(`  ✅ 更新已有用户: ${user.id} (密码已更新)`);
        }

        // 3. 确保租户成员关系存在
        const membership = await db.query.tenantMembers.findFirst({
            where: (table, { and, eq: e }) =>
                and(e(table.userId, user!.id), e(table.tenantId, tenant!.id)),
        });

        if (!membership) {
            await db.insert(tenantMembers).values({
                userId: user.id,
                tenantId: tenant.id,
                role: 'BOSS',
                roles: ['BOSS', 'ADMIN'],
                isActive: true,
            });
            console.log(`  ✅ 创建租户成员关系`);
        } else {
            console.log(`  ✅ 租户成员关系已存在`);
        }

        console.log('\n🎉 测试账号已就绪！');
        console.log(`   手机号: ${TEST_PHONE}`);
        console.log(`   密码:   ${TEST_PASSWORD}`);
        console.log(`   角色:   ADMIN (BOSS)`);
        console.log(`   租户:   ${tenant.name}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ 创建失败:', error);
        process.exit(1);
    }
}

createTestUser();
