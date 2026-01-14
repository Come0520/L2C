import 'dotenv/config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 10; // 保留最近 10 个备份

async function main() {
    // 1. 确保备份目录存在
    if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
        console.log('📁 创建备份目录: backups/');
    }

    // 2. 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(BACKUPS_DIR, `backup_${timestamp}.sql`);

    // 3. 执行备份
    const isProduction = process.env.NODE_ENV === 'production';
    const container = isProduction ? 'l2c-postgres-prod' : 'l2c-postgres';
    const dbUser = process.env.POSTGRES_USER || 'l2c_user';
    const dbName = process.env.POSTGRES_DB || (isProduction ? 'l2c' : 'l2c_dev');

    console.log(`📦 正在备份数据库 ${dbName}...`);

    try {
        execSync(
            `docker exec ${container} pg_dump -U ${dbUser} ${dbName} > "${backupFile}"`,
            { stdio: 'inherit', shell: 'cmd.exe' }
        );
        console.log(`✅ 备份完成: ${backupFile}`);

        // 4. 清理旧备份
        cleanOldBackups();
    } catch (error) {
        console.error('❌ 备份失败:', error);
        process.exit(1);
    }
}

function cleanOldBackups() {
    const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
        .map(f => ({ name: f, time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
        const toDelete = files.slice(MAX_BACKUPS);
        toDelete.forEach(f => {
            fs.unlinkSync(path.join(BACKUPS_DIR, f.name));
            console.log(`🗑️  删除旧备份: ${f.name}`);
        });
    }
}

main();
