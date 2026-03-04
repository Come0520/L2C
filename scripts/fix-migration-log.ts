/**
 * 修复迁移记录脚本
 *
 * 问题：本地数据库的所有表结构通过 db:push 创建，但迁移日志表
 * (drizzle.__drizzle_migrations) 为空，导致 db:migrate 尝试从头重跑时报冲突。
 *
 * 方案：读取 drizzle/meta/_journal.json 中的迁移条目，计算每个 SQL 文件的
 * SHA256 哈希值，然后将记录插入到 __drizzle_migrations 表中。
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

interface JournalEntry {
    idx: number;
    version: string;
    when: number;
    tag: string;
    breakpoints: boolean;
}

interface Journal {
    version: string;
    dialect: string;
    entries: JournalEntry[];
}

async function main() {
    const sql = postgres(process.env.DATABASE_URL!);

    try {
        // 1. 读取 _journal.json
        const journalPath = path.resolve('drizzle/meta/_journal.json');
        const journal: Journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
        console.log(`📋 共找到 ${journal.entries.length} 个迁移条目`);

        // 2. 检查当前迁移记录
        const existing =
            await sql`SELECT COUNT(*)::int as count FROM drizzle.__drizzle_migrations`;
        const existingCount = existing[0].count;
        console.log(`📊 当前已有迁移记录: ${existingCount} 条`);

        if (existingCount > 0) {
            console.log('⚠️ 迁移记录表不为空，跳过补录。如需强制重新补录，请先清空表。');
            return;
        }

        // 3. 遍历每个迁移条目，计算 Hash 并插入
        let inserted = 0;
        for (const entry of journal.entries) {
            const migrationPath = path.resolve(`drizzle/${entry.tag}.sql`);

            if (!fs.existsSync(migrationPath)) {
                console.error(`❌ 迁移文件不存在: ${migrationPath}`);
                continue;
            }

            // 与 Drizzle ORM 源码一致：直接读取文件内容计算 SHA256
            const content = fs.readFileSync(migrationPath).toString();
            const hash = crypto.createHash('sha256').update(content).digest('hex');

            await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at) 
        VALUES (${hash}, ${entry.when})
      `;
            inserted++;
            console.log(`  ✅ [${entry.idx}] ${entry.tag} → ${hash.substring(0, 12)}...`);
        }

        console.log(`\n🎉 补录完成！共插入 ${inserted} 条迁移记录`);

        // 4. 验证
        const verify =
            await sql`SELECT COUNT(*)::int as count FROM drizzle.__drizzle_migrations`;
        console.log(`📊 验证：迁移记录表现在有 ${verify[0].count} 条记录`);
    } catch (e) {
        console.error('❌ 脚本执行出错:', e);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
