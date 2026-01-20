import 'dotenv/config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import OSS from 'ali-oss';

// ============================================
// 配置
// ============================================
const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const MAX_LOCAL_BACKUPS = 10;  // 本地保留最近 10 个备份
const MAX_OSS_BACKUPS = 30;    // OSS 保留最近 30 个备份

// OSS 配置 (从环境变量读取)
const OSS_CONFIG = {
    region: process.env.OSS_REGION || 'oss-cn-hangzhou',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BACKUP_BUCKET || process.env.OSS_BUCKET || 'l2c-uploads',
};

// ============================================
// 主函数
// ============================================
async function main() {
    console.log('🚀 L2C 数据库备份开始...\n');

    // 1. 确保备份目录存在
    if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
        console.log('📁 创建备份目录: backups/');
    }

    // 2. 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sqlFile = path.join(BACKUPS_DIR, `backup_${timestamp}.sql`);
    const gzFile = `${sqlFile}.gz`;

    // 3. 执行数据库备份
    const isProduction = process.env.NODE_ENV === 'production';
    const container = isProduction ? 'l2c-postgres-prod' : 'l2c-postgres';
    const dbUser = process.env.POSTGRES_USER || 'l2c_user';
    const dbName = process.env.POSTGRES_DB || (isProduction ? 'l2c' : 'l2c_dev');

    console.log(`📦 正在备份数据库 ${dbName}...`);

    try {

        const { hostname } = new URL(process.env.DATABASE_URL || '');
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const useDocker = isLocalhost && !process.env.USE_NATIVE_PGDUMP;

        if (useDocker) {
            console.log('🐳 检测到本地环境，使用 Docker 执行备份...');
            execSync(
                `docker exec ${container} pg_dump -U ${dbUser} ${dbName} > "${sqlFile}"`,
                { stdio: 'inherit', shell: 'cmd.exe' }
            );
        } else {
            console.log('🌐 检测到远程/原生环境，使用本地 pg_dump 工具...');
            // 检查 pg_dump 是否存在
            try {
                execSync('pg_dump --version', { stdio: 'ignore' });
            } catch (e) {
                throw new Error('未找到 pg_dump 工具，请先安装 PostgreSQL 客户端工具');
            }

            // 使用连接字符串进行备份
            // 注意：pg_dump 支持直接传入连接字符串作为 dbname 参数
            // 格式: pg_dump "postgres://user:pass@host:port/dbname" -f output.sql
            const dbUrl = process.env.DATABASE_URL!;
            execSync(
                `pg_dump "${dbUrl}" -f "${sqlFile}"`,
                { stdio: 'inherit', shell: 'cmd.exe' }
            );
        }
        console.log(`✅ SQL 备份完成: ${sqlFile}`);

        // 4. 压缩备份文件
        await compressFile(sqlFile, gzFile);
        console.log(`✅ 压缩完成: ${path.basename(gzFile)}`);

        // 删除原始 SQL 文件，保留压缩版
        fs.unlinkSync(sqlFile);

        // 5. 上传到 OSS (如果配置了)
        if (OSS_CONFIG.accessKeyId && OSS_CONFIG.accessKeySecret) {
            await uploadToOSS(gzFile);
        } else {
            console.log('⚠️  OSS 未配置，跳过云备份');
            console.log('   设置 OSS_ACCESS_KEY_ID 和 OSS_ACCESS_KEY_SECRET 启用云备份');
        }

        // 6. 清理旧备份
        cleanOldLocalBackups();

        console.log('\n🎉 备份任务完成!');
    } catch (error) {
        console.error('❌ 备份失败:', error);
        process.exit(1);
    }
}

// ============================================
// 压缩文件
// ============================================
function compressFile(input: string, output: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(input);
        const writeStream = fs.createWriteStream(output);
        const gzip = zlib.createGzip({ level: 9 }); // 最高压缩级别

        readStream
            .pipe(gzip)
            .pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
    });
}

// ============================================
// 上传到阿里云 OSS
// ============================================
async function uploadToOSS(filePath: string) {
    console.log(`\n☁️  正在上传到 OSS...`);

    try {
        const client = new OSS({
            region: OSS_CONFIG.region,
            accessKeyId: OSS_CONFIG.accessKeyId,
            accessKeySecret: OSS_CONFIG.accessKeySecret,
            bucket: OSS_CONFIG.bucket,
        });

        const fileName = path.basename(filePath);
        const ossPath = `db-backups/${fileName}`;

        // 上传文件
        const result = await client.put(ossPath, filePath);
        console.log(`✅ OSS 上传成功: ${result.url || ossPath}`);

        // 清理 OSS 上的旧备份
        await cleanOldOSSBackups(client);

        return result;
    } catch (error: any) {
        console.error('❌ OSS 上传失败:', error.message);
        console.log('   备份文件保留在本地，请检查 OSS 配置');
    }
}

// ============================================
// 清理 OSS 旧备份
// ============================================
async function cleanOldOSSBackups(client: OSS) {
    try {
        const listResult = await client.list({
            prefix: 'db-backups/',
            'max-keys': 100,
        });

        if (!listResult.objects || listResult.objects.length <= MAX_OSS_BACKUPS) {
            return;
        }

        // 按时间排序，删除最旧的
        const sorted = listResult.objects
            .filter(obj => obj.name.endsWith('.sql.gz'))
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

        const toDelete = sorted.slice(MAX_OSS_BACKUPS);

        for (const obj of toDelete) {
            await client.delete(obj.name);
            console.log(`🗑️  删除 OSS 旧备份: ${obj.name}`);
        }
    } catch (error: any) {
        console.log('⚠️  清理 OSS 旧备份失败:', error.message);
    }
}

// ============================================
// 清理本地旧备份
// ============================================
function cleanOldLocalBackups() {
    const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.startsWith('backup_') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
        .map(f => ({ name: f, time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    if (files.length > MAX_LOCAL_BACKUPS) {
        const toDelete = files.slice(MAX_LOCAL_BACKUPS);
        toDelete.forEach(f => {
            fs.unlinkSync(path.join(BACKUPS_DIR, f.name));
            console.log(`🗑️  删除本地旧备份: ${f.name}`);
        });
    }
}

// ============================================
// 执行
// ============================================
main();
