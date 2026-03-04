#!/usr/bin/env node
/**
 * 执行 0042 迁移：
 * 1. user_role 枚举新增 SUPER_ADMIN / BOSS / DISPATCHER
 * 2. users.wechat_openid 约束从全局唯一 → 租户内复合唯一
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL 未设置');

const client = postgres(DATABASE_URL, { onnotice: () => { } });
const db = drizzle(client);

async function main() {
    console.log('🚀 执行 0042 迁移...\n');

    // 1. 枚举新增值（ADD VALUE 是幂等的，值已存在不会报错）
    console.log('⚙️  向 user_role 枚举添加新角色...');
    try {
        await db.execute(sql`ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN' BEFORE 'ADMIN'`);
        console.log('  ✅ SUPER_ADMIN');
    } catch { console.log('  ⏭️  SUPER_ADMIN 已存在，跳过'); }

    try {
        await db.execute(sql`ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'BOSS' BEFORE 'ADMIN'`);
        console.log('  ✅ BOSS');
    } catch { console.log('  ⏭️  BOSS 已存在，跳过'); }

    try {
        await db.execute(sql`ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'DISPATCHER' BEFORE 'SALES'`);
        console.log('  ✅ DISPATCHER');
    } catch { console.log('  ⏭️  DISPATCHER 已存在，跳过'); }

    // 2. 修改 wechatOpenId 约束
    console.log('\n⚙️  修改 users.wechat_openid 唯一约束...');
    // 先尝试删除旧的全局唯一约束（可能已删除）
    try {
        await db.execute(sql`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_wechat_openid_unique"`);
        console.log('  ✅ 删除旧全局唯一约束');
    } catch { console.log('  ⏭️  旧约束不存在，跳过'); }

    // 添加新的租户内复合唯一约束（若已存在则跳过）
    try {
        await db.execute(sql`ALTER TABLE "users" ADD CONSTRAINT "uq_users_tenant_wechat" UNIQUE("tenant_id", "wechat_openid")`);
        console.log('  ✅ 添加租户内复合唯一约束（tenant_id + wechat_openid）');
    } catch (e: any) {
        if (e.message?.includes('already exists')) {
            console.log('  ⏭️  约束已存在，跳过');
        } else {
            throw e;
        }
    }

    // 验证枚举
    const enumVals = await db.execute(
        sql`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') ORDER BY enumsortorder`
    );
    console.log('\n📋 当前 user_role 枚举值：');
    console.table(enumVals.rows ?? enumVals);

    console.log('\n🎉 0042 迁移完成！');
    await client.end();
}

main().catch(e => { console.error('\n❌ 迁移失败：', e.message); process.exit(1); });
