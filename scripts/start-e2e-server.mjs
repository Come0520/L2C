#!/usr/bin/env node
/**
 * 专用 E2E 测试服务器启动脚本（Standalone 模式）
 * 
 * 使用 `next build` 产出的 `.next/standalone/server.js` 启动服务器，
 * 100% 还原生产环境运行状态，同时防止开发环境变量（.env）污染测试数据库。
 *
 * 使用前请先执行：pnpm build:e2e
 */
import { spawn } from 'child_process';
import { readFileSync, existsSync, cpSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// ─── 1. 检查 standalone 构建产物 ──────────────────────────────
const standaloneDir = join(projectRoot, '.next', 'standalone');
const standaloneServer = join(standaloneDir, 'server.js');
if (!existsSync(standaloneServer)) {
    console.error('\x1b[31m[E2E-Server] 错误：未找到 standalone 构建产物！\x1b[0m');
    console.error('\x1b[33m            请先运行: pnpm build:e2e\x1b[0m');
    process.exit(1);
}

// ─── 2. 同步静态资源到 standalone 目录 ────────────────────────
// Next.js standalone 模式不会自动复制 .next/static 和 public/ 资源
console.log('[E2E-Server] 正在同步静态资源到 standalone...');

const staticSrc = join(projectRoot, '.next', 'static');
const staticDest = join(standaloneDir, '.next', 'static');
if (existsSync(staticSrc)) {
    cpSync(staticSrc, staticDest, { recursive: true, force: true });
    console.log('[E2E-Server] \x1b[32m✓ .next/static 已同步\x1b[0m');
}

const publicSrc = join(projectRoot, 'public');
const publicDest = join(standaloneDir, 'public');
if (existsSync(publicSrc)) {
    cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log('[E2E-Server] \x1b[32m✓ public/ 已同步\x1b[0m');
}

// ─── 3. 覆盖 standalone 的 .env 文件为 .env.test ─────────────
// Next.js production 模式会自动加载 .env.production / .env，
// standalone 目录中可能残留生产环境变量导致 token 签名不匹配。
const envTestPath = join(projectRoot, '.env.test');
if (existsSync(envTestPath)) {
    cpSync(envTestPath, join(standaloneDir, '.env'), { force: true });
    cpSync(envTestPath, join(standaloneDir, '.env.production'), { force: true });
    console.log('[E2E-Server] \x1b[32m✓ .env.test 已覆盖 standalone 目录的 .env 和 .env.production\x1b[0m');
}

// ─── 4. 构建干净的环境变量对象 ────────────────────────────────
const PORT = process.env.PORT || '3004';
const HOSTNAME = process.env.HOSTNAME || 'localhost';

// 清除当前进程中可能存在的污染变量
const cleanEnv = { ...process.env };
delete cleanEnv.DATABASE_URL;
delete cleanEnv.AUTH_SECRET;
delete cleanEnv.AUTH_URL;
delete cleanEnv.NEXTAUTH_URL;

// 注入必须的运行时变量
cleanEnv.NODE_ENV = 'production';
cleanEnv.PORT = PORT;
cleanEnv.HOSTNAME = HOSTNAME;
cleanEnv.AUTH_TRUST_HOST = 'true';

// ─── 5. 读取 .env.test 并注入到 process env ──────────────────
if (existsSync(envTestPath)) {
    const envContent = readFileSync(envTestPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=#\s][^=]*)=(.+)$/);
        if (match) {
            cleanEnv[match[1].trim()] = match[2].trim();
        }
    });
    console.log('[E2E-Server] \x1b[32mSuccessfully loaded .env.test overrides\x1b[0m');
}

// 确保必须的环境变量存在
if (!cleanEnv.AUTH_SECRET) {
    console.warn('[E2E-Server] \x1b[33mWarning: AUTH_SECRET is missing\x1b[0m');
    cleanEnv.AUTH_SECRET = 'e2e-fallback-secret-for-testing-only-1234567890';
}
if (!cleanEnv.AUTH_URL && !cleanEnv.NEXTAUTH_URL) {
    cleanEnv.AUTH_URL = `http://${HOSTNAME}:${PORT}`;
}
cleanEnv.NEXTAUTH_URL = cleanEnv.AUTH_URL || `http://${HOSTNAME}:${PORT}`;

console.log(`[E2E-Server] \x1b[32mStarting standalone server on port ${PORT}...\x1b[0m`);
console.log(`[E2E-Server] Target Database: ${cleanEnv.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);

// ─── 6. 启动 standalone server.js ────────────────────────────
// cwd 设为 standalone 目录——这是 standalone 的标准运行方式：
// server.js 的 __dirname 解析依赖于 cwd。
const serverProcess = spawn('node', ['server.js'], {
    cwd: standaloneDir,
    env: cleanEnv,
    stdio: 'inherit',
});

serverProcess.on('error', (err) => {
    console.error('[E2E-Server] Failed to start server:', err);
    process.exit(1);
});

serverProcess.on('exit', (code) => {
    process.exit(code || 0);
});

// 处理退出信号
const cleanup = () => {
    if (!serverProcess.killed) {
        serverProcess.kill();
    }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('exit', cleanup);
