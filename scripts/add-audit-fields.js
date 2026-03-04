import fs from 'fs';
import path from 'path';

const schemaDir = path.join(process.cwd(), 'src/shared/api/schema');

// 不处理的特殊文件
const excludeFiles = ['index.ts', 'relations.ts', 'enums.ts'];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // 正则匹配导出所有 pgTable 定义块
    // 因为表定义有可能是：export const xxx = pgTable('name', { ... }, (table) => (...))
    // 我们只关心对象定义部分

    // 简单方案：找到 createdAt 或 updatedAt，如果前两行没有 createdBy/updatedBy，就插入
    // 因为我们之前观察到大部分表都有 createdAt 或 updatedAt

    const pgTableRegex = /export const (\w+) = pgTable\(\s*'[^']+',\s*\{([\s\S]*?)\}(?:,|\))/g;

    content = content.replace(pgTableRegex, (match, tableName, tableBody) => {
        // 检查表体内是否包含 createdBy 或 updatedBy
        if (tableBody.includes("uuid('created_by')") || tableBody.includes('createdBy:') || tableBody.includes('createdBy :')) {
            return match; // 已经有，跳过
        }

        // 寻找插入点，最好在 createdAt 前面
        const createdAtIdx = tableBody.indexOf("createdAt: timestamp");
        const updatedAtIdx = tableBody.indexOf("updatedAt: timestamp");

        let insertIdx = -1;
        if (createdAtIdx !== -1) {
            insertIdx = tableBody.lastIndexOf("\n", createdAtIdx) + 1;
        } else if (updatedAtIdx !== -1) {
            insertIdx = tableBody.lastIndexOf("\n", updatedAtIdx) + 1;
        } else {
            // 都没有，插入在末尾
            const lastNewLine = tableBody.lastIndexOf("\n");
            if (lastNewLine !== -1) {
                insertIdx = lastNewLine + 1;
            }
        }

        if (insertIdx !== -1) {
            const indentMatch = tableBody.match(/\n([ \t]+)(?:createdAt|updatedAt)/);
            const indent = indentMatch ? indentMatch[1] : '    ';

            const insertStr = `${indent}// 审计字段 (H4 统一追加)\n${indent}createdBy: uuid('created_by'),\n${indent}updatedBy: uuid('updated_by'),\n`;

            const newBody = tableBody.slice(0, insertIdx) + insertStr + tableBody.slice(insertIdx);
            hasChanges = true;
            return match.replace(tableBody, newBody);
        }

        return match;
    });

    if (hasChanges) {
        // 确保导入了 uuid
        if (!content.includes('uuid,')) {
            if (content.includes("from 'drizzle-orm/pg-core'")) {
                content = content.replace("from 'drizzle-orm/pg-core'", "uuid,\n} from 'drizzle-orm/pg-core'");
            }
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Updated ${path.basename(filePath)}`);
    }
}

function run() {
    const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts') && !excludeFiles.includes(f));
    for (const f of files) {
        processFile(path.join(schemaDir, f));
    }
    console.log('🎉 批量添加审计字段完成！');
}

run();
