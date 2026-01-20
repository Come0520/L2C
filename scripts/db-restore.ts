import 'dotenv/config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

async function main() {
    const backupFile = process.argv[2];

    if (!backupFile) {
        // 列出可用备份
        const files = fs.readdirSync(BACKUPS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort()
            .reverse();

        if (files.length === 0) {
            console.log('❌ 没有找到备份文件');
            process.exit(1);
        }

        console.log('📋 可用备份:');
        files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
        console.log('\n用法: pnpm db:restore <备份文件名>');
        console.log('示例: pnpm db:restore backup_2026-01-12T21-00-00.sql');
        process.exit(0);
    }

    const fullPath = path.join(BACKUPS_DIR, backupFile);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ 备份文件不存在: ${fullPath}`);
        process.exit(1);
    }

    // 确认恢复
    const answer = await confirm(`⚠️  确定要恢复数据库到 ${backupFile} 吗？当前数据将被覆盖！(yes/no): `);
    if (answer !== 'yes') {
        console.log('❌ 恢复已取消');
        process.exit(0);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const container = isProduction ? 'l2c-postgres-prod' : 'l2c-postgres';
    const dbUser = process.env.POSTGRES_USER || 'l2c_user';
    const dbName = process.env.POSTGRES_DB || (isProduction ? 'l2c' : 'l2c_dev');

    console.log(`🔄 正在恢复数据库 ${dbName}...`);

    try {

        const { hostname } = new URL(process.env.DATABASE_URL || '');
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const useDocker = isLocalhost && !process.env.USE_NATIVE_PGCLIENT;

        if (useDocker) {
            console.log('🐳 检测到本地环境，使用 Docker 执行恢复...');
            execSync(
                `docker exec -i ${container} psql -U ${dbUser} ${dbName} < "${fullPath}"`,
                { stdio: 'inherit', shell: 'cmd.exe' }
            );
        } else {
            console.log('🌐 检测到远程/原生环境，使用本地 psql 工具...');
            // 检查 psql 是否存在
            try {
                execSync('psql --version', { stdio: 'ignore' });
            } catch (e) {
                throw new Error('未找到 psql 工具，请先安装 PostgreSQL 客户端工具');
            }

            const dbUrl = process.env.DATABASE_URL!;
            execSync(
                `psql "${dbUrl}" < "${fullPath}"`,
                { stdio: 'inherit', shell: 'cmd.exe' }
            );
        }
        console.log('✅ 恢复完成');
    } catch (error) {
        console.error('❌ 恢复失败:', error);
        process.exit(1);
    }
}

function confirm(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

main();
