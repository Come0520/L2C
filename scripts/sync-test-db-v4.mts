/**
 * 非交互式测试数据库 Schema 同步脚本（v4）
 * 使用 drizzle-kit/api 的 generateDrizzleJson + generateMigration 生成完整 DDL
 * 然后用 postgres.js 直接执行到测试数据库
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 读取 .env.test
const envTestPath = join(projectRoot, '.env.test');
if (existsSync(envTestPath)) {
    readFileSync(envTestPath, 'utf-8').split('\n').forEach(line => {
        const m = line.match(/^([^=#\s][^=]*)=(.+)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
    });
}

const dbUrl = process.env.DATABASE_URL;
console.log('🔍 目标数据库:', dbUrl?.replace(/:[^:@]*@/, ':***@'));

// 导入所有 Schema 定义
const schema = await import('../src/shared/api/schema/index.ts');
console.log('📦 已加载 Schema，表数量:', Object.keys(schema).filter(k => schema[k]?.constructor?.name === 'PgTable' || (schema[k] && typeof schema[k] === 'object' && schema[k][Symbol.for('drizzle:Name')])).length);

// 使用 drizzle-kit/api 生成 DDL
const { generateDrizzleJson, generateMigration } = await import('drizzle-kit/api');

// 生成当前 Schema 的 JSON 快照
const currentJson = generateDrizzleJson(schema);

// 生成从空数据库到当前 Schema 的迁移 SQL
// generateMigration 接受 `prev` 和 `cur` 两个 JSON 快照
const emptyJson = generateDrizzleJson({});
const migration = await generateMigration(emptyJson, currentJson);

console.log(`\n📋 生成了 ${migration.length} 条 SQL 语句`);

if (migration.length === 0) {
    console.log('⚠️  没有生成任何 SQL 语句，可能 Schema 导入不正确');
    process.exit(1);
}

// 用 postgres.js 直接执行
const sql = postgres(dbUrl, { max: 1 });

let success = 0;
let errors = 0;

for (let i = 0; i < migration.length; i++) {
    const stmt = migration[i];
    try {
        await sql.unsafe(stmt);
        success++;
        if ((i + 1) % 50 === 0) {
            console.log(`  进度: ${i + 1}/${migration.length} (成功: ${success}, 错误: ${errors})`);
        }
    } catch (e) {
        // 忽略 "already exists" 类型错误
        if (['42P07', '42710', '42P06'].includes(e.code)) {
            // 表/类型/schema 已存在
        } else {
            errors++;
            if (errors <= 10) {
                console.error(`  ❌ [${e.code}] ${stmt.substring(0, 120)}...`);
                console.error(`     ${e.message.substring(0, 200)}`);
            }
        }
    }
}

console.log(`\n✅ Schema 同步完成！执行了 ${success} 条语句，${errors} 个错误`);

// 验证表数量
const tables = await sql`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = 'public'`;
console.log(`📊 数据库表数量: ${tables[0].cnt}`);

// 检查关键表
const check = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'measure_tasks' AND column_name = 'labor_fee'`;
console.log(`🔍 measure_tasks.labor_fee: ${check.length > 0 ? '✅ 存在' : '❌ 不存在'}`);

await sql.end();
process.exit(0);
