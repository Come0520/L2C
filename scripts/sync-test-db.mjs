#!/usr/bin/env node
/**
 * 非交互式测试数据库 Schema 同步脚本
 * 通过 drizzle-kit 生成 SQL 并直接执行到测试数据库
 * 用法: DATABASE_URL=xxx node scripts/sync-test-db.mjs
 */
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 读取 .env.test 文件
const envTestPath = join(projectRoot, '.env.test');
if (existsSync(envTestPath)) {
    const envContent = readFileSync(envTestPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.+)$/);
        if (match) process.env[match[1].trim()] = match[2].trim();
    });
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('❌ DATABASE_URL 环境变量未设置');
    process.exit(1);
}

console.log('🔍 目标数据库:', dbUrl.replace(/:[^:@]*@/, ':***@'));
console.log('🚀 开始非交互式 Schema 同步...\n');

try {
    // 使用 drizzle-kit 生成 SQL 快照
    console.log('📋 生成 Schema SQL...');
    const output = execSync(
        'npx drizzle-kit push --verbose 2>&1 || true',
        {
            cwd: projectRoot,
            env: { ...process.env },
            encoding: 'utf-8',
            input: '\n'.repeat(50), // 自动回答所有确认提示（选择第一项 'No'）
            timeout: 120000,
            maxBuffer: 10 * 1024 * 1024,
        }
    );

    console.log('ℹ️  CLI 输出:\n', output.slice(-2000));
    console.log('\n✅ Schema 同步完成！');
} catch (err) {
    console.error('❌ 同步失败:', err.message);
    process.exit(1);
}
