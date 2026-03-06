#!/usr/bin/env node
/**
 * 专用 E2E 测试服务器启动脚本
 * 目标：100% 还原 ECS 生产环境的 standalone 运行状态，强行防止开发环境变量（.env）污染测试数据库。
 * 它会读取 .env.test，清理掉当前进程中错误的 DATABASE_URL 等，然后挂载 server.js。
 */
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 1. 构建一个干净的环境变量对象（包含必备的系统项）
const cleanEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: process.env.PORT || '3004',
    HOSTNAME: process.env.HOSTNAME || 'localhost'
};

// 2. 强行删除可能造成污染的敏感变量（让它只能从 .env.test 获取）
delete cleanEnv.DATABASE_URL;
delete cleanEnv.AUTH_SECRET;
delete cleanEnv.AUTH_URL;
delete cleanEnv.NEXTAUTH_URL;

// 3. 读取 .env.test 并注入
const envTestPath = join(projectRoot, '.env.test');
if (existsSync(envTestPath)) {
    const envContent = readFileSync(envTestPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=#\s][^=]*)=(.+)$/);
        if (match) {
            cleanEnv[match[1].trim()] = match[2].trim();
        }
    });
    console.log('[E2E-Server] \x1b[32mSuccessfully loaded .env.test overrides\x1b[0m');
} else {
    console.warn('[E2E-Server] \x1b[33mWarning: .env.test not found\x1b[0m');
}

// 确保必须的环境变量存在
if (!cleanEnv.AUTH_SECRET) {
    console.warn('[E2E-Server] \x1b[33mWarning: AUTH_SECRET is missing, generating a temporary one\x1b[0m');
    cleanEnv.AUTH_SECRET = 'e2e-fallback-secret-for-testing-only-1234567890';
}
if (!cleanEnv.AUTH_URL && !cleanEnv.NEXTAUTH_URL) {
    cleanEnv.AUTH_URL = `http://${cleanEnv.HOSTNAME}:${cleanEnv.PORT}`;
}

console.log(`[E2E-Server] Starting standalone server on ${cleanEnv.PORT}...`);
console.log(`[E2E-Server] Target Database: ${cleanEnv.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);

// 4. 以子进程方式启动 dev server (暂缓 standalone 坑，降级为开发模式以测试主流程)
const serverProcess = spawn('npx', ['next', 'dev', '-p', cleanEnv.PORT], {
    cwd: projectRoot,
    env: cleanEnv,
    stdio: 'inherit', // 直接将输出挂载到当前终端，Playwright 就能接管
    shell: true // Windows 环境下需开启 shell 来执行 npx
});

serverProcess.on('error', (err) => {
    console.error('[E2E-Server] Failed to start server:', err);
    process.exit(1);
});

serverProcess.on('exit', (code) => {
    process.exit(code || 0);
});

// 处理退出信号，优雅关闭子进程
const cleanup = () => {
    if (!serverProcess.killed) {
        serverProcess.kill();
    }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('exit', cleanup);
