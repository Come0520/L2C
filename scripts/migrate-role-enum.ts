#!/usr/bin/env node
/**
 * 角色枚举精简迁移脚本（最终版：10 角色）
 * 
 * 当前数据库状态：
 * - users.role 和 tenant_members.role 都已是 text 类型
 * - user_role 枚举类型已有 7 个值（ADMIN/MANAGER/SALES/FINANCE/WORKER/CUSTOMER/SUPPLY）
 * 
 * 本脚本目标：
 * 1. 迁移数据：TECH→WORKER，USER→CUSTOMER，MEASURER→WORKER，INSTALLER→WORKER，DISPATCHER 保留
 * 2. 重建枚举为最终 10 个角色
 * 3. 将 users.role 和 tenant_members.role 重新绑定到新枚举
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL 未设置，请检查 .env.local');

const client = postgres(DATABASE_URL, { onnotice: () => { } });
const db = drizzle(client);

async function main() {
    console.log('🚀 角色枚举迁移（最终版：10 角色）\n');

    // ===== 查看当前角色分布 =====
    console.log('📊 迁移前 users.role 分布：');
    const before = await db.execute(sql`SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`);
    console.table(before.rows ?? before);

    // ===== 数据迁移：旧值 → 新值 =====
    console.log('\n⚙️  数据迁移...');
    const migrations = [
        { q: sql`UPDATE users SET role = 'ADMIN'   WHERE role IN ('BOSS','OWNER','SUPER_ADMIN','TENANT_ADMIN')`, label: 'users: 旧管理员类 → ADMIN' },
        { q: sql`UPDATE users SET role = 'MANAGER' WHERE role IN ('STORE_MANAGER','AREA_MANAGER')`, label: 'users: 店长/区经 → MANAGER' },
        { q: sql`UPDATE users SET role = 'WORKER'  WHERE role IN ('INSTALLER','MEASURER','TECH')`, label: 'users: 工种 → WORKER' },
        { q: sql`UPDATE users SET role = 'FINANCE' WHERE role IN ('FINANCE_BOOKKEEPER','FINANCE_REVIEWER','FINANCE_SUPERVISOR')`, label: 'users: 财务子类 → FINANCE' },
        { q: sql`UPDATE users SET role = 'SUPPLY'  WHERE role IN ('PURCHASER')`, label: 'users: 采购 → SUPPLY' },
        { q: sql`UPDATE users SET role = 'CUSTOMER' WHERE role IN ('USER')`, label: 'users: USER → CUSTOMER' },
        // tenant_members 同步
        { q: sql`UPDATE tenant_members SET role = 'ADMIN'   WHERE role IN ('BOSS','OWNER','SUPER_ADMIN','TENANT_ADMIN')`, label: 'tenant_members: 旧管理员类 → ADMIN' },
        { q: sql`UPDATE tenant_members SET role = 'MANAGER' WHERE role IN ('STORE_MANAGER','AREA_MANAGER')`, label: 'tenant_members: 店长/区经 → MANAGER' },
        { q: sql`UPDATE tenant_members SET role = 'WORKER'  WHERE role IN ('INSTALLER','MEASURER','TECH')`, label: 'tenant_members: 工种 → WORKER' },
        { q: sql`UPDATE tenant_members SET role = 'FINANCE' WHERE role IN ('FINANCE_BOOKKEEPER','FINANCE_REVIEWER','FINANCE_SUPERVISOR')`, label: 'tenant_members: 财务子类 → FINANCE' },
        { q: sql`UPDATE tenant_members SET role = 'SUPPLY'  WHERE role IN ('PURCHASER')`, label: 'tenant_members: 采购 → SUPPLY' },
        { q: sql`UPDATE tenant_members SET role = 'CUSTOMER' WHERE role IN ('USER')`, label: 'tenant_members: USER → CUSTOMER' },
    ];

    for (const { q, label } of migrations) {
        const result = await db.execute(q);
        const cnt = (result as any).rowCount ?? 0;
        if (cnt > 0) console.log(`  ✅ ${label}（${cnt} 行）`);
    }

    // ===== 合法性校验 =====
    const validRoles = ['SUPER_ADMIN', 'BOSS', 'ADMIN', 'MANAGER', 'DISPATCHER', 'SALES', 'FINANCE', 'WORKER', 'CUSTOMER', 'SUPPLY'];
    const illegalUsers = await db.execute(
        sql`SELECT DISTINCT role FROM users WHERE role NOT IN ('SUPER_ADMIN','BOSS','ADMIN','MANAGER','DISPATCHER','SALES','FINANCE','WORKER','CUSTOMER','SUPPLY')`
    );
    const illegalRows = (illegalUsers.rows ?? illegalUsers) as any[];
    if (illegalRows.length > 0) {
        console.warn('\n⚠️  仍有非法角色值：', illegalRows.map((r: any) => r.role));
        console.warn('   兜底处理：全部设为 SALES');
        await db.execute(sql`UPDATE users SET role = 'SALES' WHERE role NOT IN ('SUPER_ADMIN','BOSS','ADMIN','MANAGER','DISPATCHER','SALES','FINANCE','WORKER','CUSTOMER','SUPPLY')`);
        await db.execute(sql`UPDATE tenant_members SET role = 'SALES' WHERE role NOT IN ('SUPER_ADMIN','BOSS','ADMIN','MANAGER','DISPATCHER','SALES','FINANCE','WORKER','CUSTOMER','SUPPLY')`);
    } else {
        console.log('\n✅ 无非法角色值，可安全重建枚举');
    }

    // ===== 重建枚举类型 =====
    console.log('\n🔄 重建 user_role 枚举（10 角色）...');
    await db.execute(sql`ALTER TABLE users ALTER COLUMN role SET DATA TYPE text`);
    await db.execute(sql`ALTER TABLE tenant_members ALTER COLUMN role SET DATA TYPE text`);
    await db.execute(sql`DROP TYPE IF EXISTS "public"."user_role" CASCADE`);
    await db.execute(sql`CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN','BOSS','ADMIN','MANAGER','DISPATCHER','SALES','FINANCE','WORKER','CUSTOMER','SUPPLY')`);
    await db.execute(sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'SALES'::"public"."user_role"`);
    await db.execute(sql`ALTER TABLE users ALTER COLUMN role SET DATA TYPE "public"."user_role" USING role::"public"."user_role"`);
    await db.execute(sql`ALTER TABLE tenant_members ALTER COLUMN role SET DEFAULT 'SALES'::"public"."user_role"`);
    await db.execute(sql`ALTER TABLE tenant_members ALTER COLUMN role SET DATA TYPE "public"."user_role" USING role::"public"."user_role"`);
    console.log('  ✅ user_role 枚举已更新为 10 个核心角色');

    // ===== 验证结果 =====
    console.log('\n📊 迁移后 users.role 分布：');
    const after = await db.execute(sql`SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`);
    console.table(after.rows ?? after);

    // 验证枚举值
    const enumCheck = await db.execute(
        sql`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') ORDER BY enumsortorder`
    );
    console.log('\n📋 数据库 user_role 枚举当前值：');
    console.table(enumCheck.rows ?? enumCheck);

    console.log('\n🎉 迁移完成！');
    await client.end();
}

main().catch(e => { console.error('\n❌ 迁移失败：', e.message); process.exit(1); });
