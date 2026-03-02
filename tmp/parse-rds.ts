/**
 * 本地 Schema 解析与 RDS 对比审计脚本
 * 从 drizzle-kit introspect 输出中提取表信息
 */
import * as fs from 'fs';
import * as path from 'path';

// 读取 RDS 导出的列信息
const rdsColumnsPath = path.join(__dirname, '../tmp/rds-columns.txt');
const rdsData = fs.readFileSync(rdsColumnsPath, 'utf-8');

// 解析 RDS 数据（table_name|column_name|data_type|is_nullable|column_default）
interface ColumnInfo {
    tableName: string;
    columnName: string;
    dataType: string;
    isNullable: string;
    columnDefault: string | null;
}

const rdsColumns: ColumnInfo[] = [];
for (const line of rdsData.split('\n')) {
    const parts = line.trim().split('|');
    if (parts.length >= 4) {
        rdsColumns.push({
            tableName: parts[0],
            columnName: parts[1],
            dataType: parts[2],
            isNullable: parts[3],
            columnDefault: parts[4] || null,
        });
    }
}

// 按表名分组 RDS 数据
const rdsTableMap: Record<string, ColumnInfo[]> = {};
for (const col of rdsColumns) {
    if (!rdsTableMap[col.tableName]) rdsTableMap[col.tableName] = [];
    rdsTableMap[col.tableName].push(col);
}

const rdsTables = new Set(Object.keys(rdsTableMap));
console.log(`RDS 表总计：${rdsTables.size} 张`);
console.log('RDS 表列表：');
console.log([...rdsTables].sort().join('\n'));
console.log('\n');

// 输出 JSON 供进一步分析
const output = {
    rdsTableCount: rdsTables.size,
    rdsTables: [...rdsTables].sort(),
    rdsSchema: rdsTableMap,
};

fs.writeFileSync(path.join(__dirname, '../tmp/rds-schema.json'), JSON.stringify(output, null, 2));
console.log('已保存到 tmp/rds-schema.json');
