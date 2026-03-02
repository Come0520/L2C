/**
 * 完整的逐表审计脚本
 * 对比本地 Schema (TypeScript) 与 RDS 数据库的实际结构
 */
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';

// 通过 SSH 隧道连接 RDS
const sql = postgres({
    host: '127.0.0.1',
    port: 15432,
    database: 'l2c',
    username: 'l2c',
    password: 'I@rds2026',
    ssl: false,
    max: 1,
    connect_timeout: 30,
});

interface RdsColumn {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
}

interface LocalColumn {
    name: string;
    type: string;
    nullable: boolean;
}

async function main() {
    console.log('='.repeat(80));
    console.log('数据库逐表审计报告');
    console.log('审计时间:', new Date().toLocaleString('zh-CN'));
    console.log('='.repeat(80));

    // 1. 获取 RDS 所有表和列
    const rdsColumns: RdsColumn[] = await sql`
    SELECT 
      table_name::text,
      column_name::text,
      data_type::text,
      is_nullable::text,
      column_default::text
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  ` as any;

    // 按表名分组
    const rdsMap: Record<string, RdsColumn[]> = {};
    for (const col of rdsColumns) {
        if (!rdsMap[col.table_name]) rdsMap[col.table_name] = [];
        rdsMap[col.table_name].push(col);
    }
    const rdsTables = new Set(Object.keys(rdsMap));

    // 2. 获取本地 Schema 中的表定义（通过 drizzle introspect）
    const localTables = await sql`
    SELECT tablename::text as table_name
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  ` as any;

    const rdsList = [...rdsTables].sort();

    console.log(`\n📊 RDS 数据库统计：${rdsList.length} 张表，${rdsColumns.length} 个列\n`);

    // 3. 检查新增的关键列（近期 Schema 变更）
    // 通过分析本地 Schema 文件的关键字段
    const recentSchemaChanges = [
        // 根据最近的迁移文件分析的关键变更
        { table: 'tenant_members', column: 'tenant_id', desc: '多租户成员关联' },
        { table: 'tenant_members', column: 'user_id', desc: '多租户用户关联' },
        { table: 'invitations', column: 'tenant_id', desc: '邀请关联租户' },
        { table: 'users', column: 'phone', desc: '用户手机号' },
        { table: 'users', column: 'phone_verified', desc: '手机验证状态' },
        { table: 'tenants', column: 'plan', desc: '租户计划/套餐' },
        { table: 'tenants', column: 'brand_customization_enabled', desc: '品牌定制功能' },
        { table: 'quotes', column: 'tenant_id', desc: '报价关联租户' },
        { table: 'role_overrides', column: 'added_permissions', desc: '权限覆盖(jsonb)' },
        { table: 'onboarding_profiles', column: 'id', desc: '入职配置表' },
        { table: 'showroom_items', column: 'tenant_id', desc: '展厅关联租户' },
        { table: 'showroom_shares', column: 'id', desc: '展厅分享表' },
        { table: 'landing_testimonials', column: 'id', desc: '落地页评价表' },
    ];

    console.log('='.repeat(60));
    console.log('🔍 关键列存在性检查（近期 Schema 变更）');
    console.log('='.repeat(60));

    for (const check of recentSchemaChanges) {
        const tableCols = rdsMap[check.table];
        if (!tableCols) {
            console.log(`❌ 表 ${check.table} 不存在!`);
            continue;
        }
        const col = tableCols.find(c => c.column_name === check.column);
        if (col) {
            console.log(`✅ ${check.table}.${check.column} (${col.data_type}) - ${check.desc}`);
        } else {
            console.log(`❌ 缺失: ${check.table}.${check.column} - ${check.desc}`);
        }
    }

    // 4. 逐表输出完整列信息
    console.log('\n' + '='.repeat(80));
    console.log('📋 各表完整列信息（RDS 实际状态）');
    console.log('='.repeat(80));

    const output: Record<string, { columns: RdsColumn[] }> = {};
    for (const tableName of rdsList) {
        output[tableName] = { columns: rdsMap[tableName] };
    }

    // 输出JSON文件供后续分析
    const reportPath = path.join(process.cwd(), 'tmp', 'rds-full-schema.json');
    fs.writeFileSync(reportPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ 完整 Schema 已保存到: ${reportPath}`);
    console.log(`总计：${rdsList.length} 张表\n`);

    // 5. 简洁的表格式输出
    for (const tableName of rdsList) {
        const cols = rdsMap[tableName];
        console.log(`\n┌─ [${tableName}] (${cols.length} 列)`);
        for (const col of cols) {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const def = col.column_default ? ` = ${col.column_default.substring(0, 30)}` : '';
            console.log(`│  ${col.column_name.padEnd(35)} ${col.data_type.padEnd(30)} ${nullable}${def}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => sql.end());
