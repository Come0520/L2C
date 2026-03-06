/**
 * 非交互式测试数据库 Schema 同步脚本（v3）
 * 使用 drizzle-kit/api 的编程接口直接推送 Schema，无需交互确认
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

// 动态导入 drizzle-kit/api
const api = await import('drizzle-kit/api');
console.log('📦 drizzle-kit/api 可用方法:', Object.keys(api).join(', '));

// 尝试使用 pushSchema 或 pgPush 或任何可用的 push 函数
if (typeof api.pgPush === 'function') {
    console.log('🚀 使用 pgPush...');
    const result = await api.pgPush({
        schema: join(projectRoot, 'src/shared/api/schema/index.ts'),
        credentials: { url: dbUrl },
        strict: false,
        verbose: true,
    });
    console.log('✅ 结果:', JSON.stringify(result, null, 2));
} else if (typeof api.pushSchema === 'function') {
    console.log('🚀 使用 pushSchema...');
    const result = await api.pushSchema({
        schema: join(projectRoot, 'src/shared/api/schema/index.ts'),
        credentials: { url: dbUrl },
    });
    console.log('✅ 结果:', JSON.stringify(result, null, 2));
} else {
    // 打印所有导出以便调试
    console.log('⚠️  未找到 push 相关函数。导出列表:');
    for (const [key, val] of Object.entries(api)) {
        console.log(`  - ${key}: ${typeof val}`);
    }
}

process.exit(0);
