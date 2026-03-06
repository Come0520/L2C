// 强制加载 .env.test 确保连接到测试数据库（l2c_test @ 127.0.0.1:5434）
// 不使用 dotenv/config（会加载 .env 即开发 DB），避免操作错误的数据库
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });
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
                    // 注意：E2E 账号必须是普通租户管理员（非平台超管）
                    // 若设为 isPlatformAdmin: true，auth.ts 会将 tenantId 设为 '__PLATFORM__'（非法 UUID）
                    // 导致所有业务 DB 查询触发 PostgreSQL 22P02 错误
                    isPlatformAdmin: false,
                    lastActiveTenantId: tenant.id,
                })
                .returning();
            user = newUser;
            console.log(`    Created new user: ${user.id}`);
        } else {
            console.log(`    Found existing user: ${user.id}`);
            // 确保 E2E 账号密码正确，并强制设置为非平台超管
            const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
            await db.update(users).set({ passwordHash, tenantId: tenant.id, role: 'ADMIN', isPlatformAdmin: false }).where(eq(users.id, user.id));
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
