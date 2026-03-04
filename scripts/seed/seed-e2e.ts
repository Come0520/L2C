import 'dotenv/config'; // Add this to load .env / .env.local
import { db } from '../../src/shared/api/db';
import { tenants, users, tenantMembers } from '../../src/shared/api/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const E2E_PHONE = '13800000001';
const E2E_PASSWORD = '123456';
const TENANT_CODE = 'E2E-TEST';

async function seed() {
    console.log('🌱 Starting E2E database seeding...');

    try {
        // 1. 获取或创建 E2E 专属租户
        console.log(`[1] Provisioning E2E tenant [${TENANT_CODE}]...`);
        let tenant = await db.query.tenants.findFirst({
            where: eq(tenants.code, TENANT_CODE),
        });

        if (!tenant) {
            const [newTenant] = await db
                .insert(tenants)
                .values({
                    name: 'E2E 自动化测试公司',
                    code: TENANT_CODE,
                    status: 'active',
                    planType: 'enterprise',
                    isGrandfathered: true,
                })
                .returning();
            tenant = newTenant;
            console.log(`    Created new tenant: ${tenant.id}`);
        } else {
            console.log(`    Found existing tenant: ${tenant.id}`);
        }

        // 2. 获取或创建 E2E 全局管理员账号
        console.log(`[2] Provisioning E2E super user [${E2E_PHONE}]...`);
        let user = await db.query.users.findFirst({
            where: eq(users.phone, E2E_PHONE),
        });

        if (!user) {
            const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
            const [newUser] = await db
                .insert(users)
                .values({
                    tenantId: tenant.id, // Primary tenant binding
                    phone: E2E_PHONE,
                    name: 'E2E 管理员',
                    passwordHash,
                    role: 'ADMIN',
                    isActive: true,
                    isPlatformAdmin: true,
                    lastActiveTenantId: tenant.id,
                })
                .returning();
            user = newUser;
            console.log(`    Created new user: ${user.id}`);
        } else {
            console.log(`    Found existing user: ${user.id}`);
            // Ensure the E2E user password is correct just in case it was messed up
            const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
            await db.update(users).set({ passwordHash, tenantId: tenant.id, role: 'ADMIN', isPlatformAdmin: true }).where(eq(users.id, user.id));
        }

        // 3. 关联或更新租户成员关系
        console.log(`[3] Binding membership with BOSS role...`);
        const membership = await db.query.tenantMembers.findFirst({
            where: (table, { and, eq }) =>
                and(eq(table.userId, user!.id), eq(table.tenantId, tenant!.id)),
        });

        if (!membership) {
            await db.insert(tenantMembers).values({
                userId: user.id,
                tenantId: tenant.id,
                role: 'BOSS',
                roles: ['BOSS', 'ADMIN'],
                isActive: true,
            });
            console.log(`    Created new membership for user: ${user.id}`);
        } else {
            await db.update(tenantMembers).set({ role: 'BOSS', roles: ['BOSS', 'ADMIN'], isActive: true }).where(eq(tenantMembers.id, membership.id));
            console.log(`    Updated existing membership for user: ${user.id}`);
        }

        console.log('✅ E2E Seed completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ E2E Seeding failed:', error);
        process.exit(1);
    }
}

seed();
