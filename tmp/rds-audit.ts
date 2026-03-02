/**
 * RDS 数据库审计脚本 v2 - 分离连接参数
 */
import postgres from 'postgres';

async function main() {
  // RDS 连接信息（避免 URL 编码问题）
  const sql = postgres({
    host: 'pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com',
    port: 5432,
    database: 'l2c',
    username: 'l2c',
    password: 'I@rds2026',
    ssl: 'require',
    max: 1,
    connect_timeout: 30,
    idle_timeout: 20,
  });

  try {
    console.log('正在连接 RDS...');

    // 1. 测试连接
    const testResult = await sql`SELECT version()`;
    console.log('连接成功！PostgreSQL 版本:', testResult[0].version);

    // 2. 获取所有表
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    const tableNames = tables.map((r: any) => r.tablename);
    console.log('\n=== RDS 中存在的表 ===');
    console.log(JSON.stringify(tableNames, null, 2));
    console.log(`\n总计：${tableNames.length} 张表\n`);

    // 3. 获取每张表的列信息
    const tableSchema: Record<string, any[]> = {};

    for (const table of tableNames) {
      const cols = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = ${table}
        ORDER BY ordinal_position
      `;
      tableSchema[table] = cols as any;
    }

    console.log('=== 各表列信息 ===');
    console.log(JSON.stringify(tableSchema, null, 2));

    // 4. 获取枚举类型
    const enumRows = await sql`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder
    `;

    const enums: Record<string, string[]> = {};
    for (const row of enumRows) {
      const name = row.enum_name as string;
      const val = row.enum_value as string;
      if (!enums[name]) enums[name] = [];
      enums[name].push(val);
    }

    console.log('\n=== RDS 中存在的枚举类型 ===');
    console.log(JSON.stringify(enums, null, 2));

  } finally {
    await sql.end();
    console.log('\n连接已关闭');
  }
}

main().catch(e => {
  console.error('错误:', e.message);
  process.exit(1);
});
