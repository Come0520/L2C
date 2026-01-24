const fs = require('fs');
const postgres = require('postgres');

// 1. 读取已经上传到容器内的 full_migration.sql
const sqlContent = fs.readFileSync('/app/full_migration.sql', 'utf8');

// 2. 连接数据库 (直接从环境变量读取 DATABASE_URL)
const sql = postgres(process.env.DATABASE_URL);

async function main() {
    console.log('🔗 Connecting to database...');
    try {
        // 3. 将整个 SQL 文件作为一个事务执行
        // 注意：postgres.js 的 `file` 方法可以直接读文件，也可以直接 `sql` 执行字符串。
        // 由于里面包含多个语句，最好用 `sql.unsafe` 或者 split 处理。
        // Drizzle 生成的 SQL 用 `--> statement-breakpoint` 分隔。

        const statements = sqlContent.split('--> statement-breakpoint');
        console.log(`📦 Found ${statements.length} statements to execute.`);

        for (const [index, stmt] of statements.entries()) {
            const trimmed = stmt.trim();
            if (!trimmed) continue;

            console.log(`⏳ Executing statement ${index + 1}/${statements.length}...`);
            try {
                await sql.unsafe(trimmed);
            } catch (err) {
                // 如果是 "relation already exists" 错误，可以忽略（幂等性）
                if (err.code === '42P07') {
                    console.warn(`⚠️  Table/Relation already exists, skipping.`);
                } else if (err.code === '42710') {
                    console.warn(`⚠️  Duplicate object, skipping.`);
                } else {
                    console.error(`❌ Statement failed: ${trimmed.substring(0, 50)}...`);
                    throw err;
                }
            }
        }

        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
