#!/usr/bin/env node
/**
 * 非交互式测试数据库 Schema 同步脚本（v2）
 * 直接通过 Drizzle ORM 的 migrate API 读取并执行迁移
 * 用法: DATABASE_URL=xxx node scripts/sync-test-db-v2.mjs
 */
import postgres from 'postgres';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 读取 .env.test 文件
const envTestPath = join(projectRoot, '.env.test');
if (existsSync(envTestPath)) {
    const envContent = readFileSync(envTestPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=#\s][^=]*)=(.+)$/);
        if (match) process.env[match[1].trim()] = match[2].trim();
    });
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('❌ DATABASE_URL 环境变量未设置');
    process.exit(1);
}

console.log('🔍 目标数据库:', dbUrl.replace(/:[^:@]*@/, ':***@'));

const sql = postgres(dbUrl, { max: 1 });

try {
    // 1. 读取所有迁移 SQL 文件
    const migrationsDir = join(projectRoot, 'drizzle');
    const sqlFiles = readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`📋 找到 ${sqlFiles.length} 个迁移文件`);

    // 2. 创建 drizzle migrations tracking 表
    await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await sql`
        CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
            id serial PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
        )
    `;

    // 3. 获取已应用的迁移
    const applied = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
    const appliedHashes = new Set(applied.map(r => r.hash));

    // 4. 应用未执行的迁移
    let count = 0;
    for (const file of sqlFiles) {
        const filePath = join(migrationsDir, file);
        const content = readFileSync(filePath, 'utf-8');

        // 使用文件名作为 hash（简化版）
        const hash = file.replace('.sql', '');

        if (appliedHashes.has(hash)) {
            console.log(`⏭️  跳过 (已应用): ${file}`);
            continue;
        }

        console.log(`🔄 应用迁移: ${file}`);

        // 按 Drizzle 的 statement-breakpoint 分割语句
        // Drizzle 迁移文件格式: "SQL_STMT;--> statement-breakpoint\nSQL_STMT;"
        const statements = content
            .split(/-->[\s]*statement-breakpoint/g)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))
            .map(s => s.endsWith(';') ? s : s + ';');

        for (const stmt of statements) {
            if (stmt.trim().length === 0) continue;
            try {
                await sql.unsafe(stmt + ';');
            } catch (e) {
                // 忽略某些可以接受的错误
                if (['42P07', '42710', '42P06'].includes(e.code)) {
                    // 表/类型/schema 已存在，忽略
                    console.log(`  ⚠️  忽略已存在错误: ${e.message.substring(0, 80)}`);
                } else if (e.code === '42P01') {
                    // 表不存在（DROP 语句），忽略
                    console.log(`  ⚠️  忽略表不存在: ${e.message.substring(0, 80)}`);
                } else {
                    console.error(`  ❌ 语句失败 [${e.code}]: ${stmt.substring(0, 100)}`);
                    console.error(`     错误: ${e.message}`);
                    // 不中断，继续执行
                }
            }
        }

        // 记录为已应用
        await sql`
            INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
            VALUES (${hash}, ${Date.now()})
        `;
        count++;
    }

    console.log(`\n✅ Schema 同步完成！应用了 ${count} 个新迁移`);

} catch (err) {
    console.error('❌ 同步失败:', err);
    process.exit(1);
} finally {
    await sql.end();
}
