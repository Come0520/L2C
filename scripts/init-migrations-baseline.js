/**
 * 迁移历史初始化脚本 v2
 * 
 * 作用：将生产库从 push 模式安全过渡到 migrate 模式。
 * 工作原理：读取 journal.json，为每个历史迁移读取对应的 SQL 文件内容计算 hash，
 * 然后写入 __drizzle_migrations 表，使 drizzle-kit migrate 认为它们已执行。
 */

const postgres = require('/app/node_modules/postgres');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sql = postgres(process.env.DATABASE_URL);

async function run() {
    try {
        console.log('=== 迁移历史基线初始化脚本 v2 ===');

        // 1. 检查表（drizzle-kit 可能使用 drizzle schema 或 public schema）
        const schemas = ['drizzle', 'public'];
        let tableSchema = null;
        let existingCount = 0;

        for (const schema of schemas) {
            const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = ${schema}
          AND table_name = '__drizzle_migrations'
        ) as exists
      `;
            if (result[0].exists) {
                tableSchema = schema;
                const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${schema}.__drizzle_migrations`);
                existingCount = parseInt(countResult[0].count);
                console.log(`✅ 发现 ${schema}.__drizzle_migrations 表，当前记录数：${existingCount}`);
                break;
            }
        }

        if (!tableSchema) {
            // 表不存在，创建它
            await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
            await sql`
        CREATE TABLE drizzle.__drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )
      `;
            tableSchema = 'drizzle';
            console.log('✅ 已创建 drizzle.__drizzle_migrations 表');
        }

        if (existingCount > 0) {
            console.log(`ℹ️  表中已有 ${existingCount} 条记录，无需重新初始化`);
            process.exit(0);
        }

        // 2. 读取 journal 
        const tryPaths = ['/app/drizzle/meta/_journal.json', '/tmp/drizzle/meta/_journal.json'];
        let journalPath = null;
        for (const p of tryPaths) {
            if (fs.existsSync(p)) { journalPath = p; break; }
        }
        if (!journalPath) throw new Error('找不到 _journal.json，尝试了：' + tryPaths.join(', '));

        const drizzleDir = path.dirname(journalPath).replace('/meta', '');
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

        console.log(`📋 journal 记录了 ${journal.entries.length} 条迁移历史，开始写入...`);

        // 3. 为每条历史迁移插入记录
        let insertCount = 0;
        for (const entry of journal.entries) {
            const sqlFilePath = path.join(drizzleDir, `${entry.tag}.sql`);

            if (!fs.existsSync(sqlFilePath)) {
                console.log(`⚠️ 文件不存在，跳过：${entry.tag}.sql`);
                continue;
            }

            const fileContent = fs.readFileSync(sqlFilePath, 'utf8');
            const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

            await sql.unsafe(
                `INSERT INTO ${tableSchema}.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
                [hash, entry.when]
            );
            insertCount++;
        }

        console.log(`\n🎉 基线初始化完成！共标记 ${insertCount} 条迁移为已执行。`);
        console.log('   未来执行 drizzle-kit migrate 将只处理新增的迁移文件。');

    } catch (err) {
        console.error('❌ 初始化失败：', err.message);
        process.exit(1);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

run();
