const fs = require('fs');

function processFile(file) {
    let content = fs.readFileSync(file, 'utf-8');
    const tables = content.match(/export const (\w+) = pgTable\(\s*'[^']+',\s*\{([\s\S]*?)\}(?:,|\))/g);
    if (!tables) return;
    for (const tableMatch of tables) {
        // 找出 table body
        const match = tableMatch.match(/(export const \w+ = pgTable\(\s*'[^']+',\s*\{)([\s\S]*?)(\}(?:,|\)))/);
        if (!match) continue;
        let [full, top, body, bottom] = match;

        // 如果已经包含 createdBy, 更新
        if (body.includes("createdBy: uuid('created_by')")) continue;

        // 我们只需要把字段安全地插入在 bottom 之前
        const insertStr = `\n    // 审计字段 (H4 统一追加)\n    createdBy: uuid('created_by'),\n    updatedBy: uuid('updated_by'),\n  `;
        const newTable = top + body + insertStr + bottom;
        content = content.replace(tableMatch, newTable);
    }
    fs.writeFileSync(file, content, 'utf-8');
}

processFile('src/shared/api/schema/service.ts');
processFile('src/shared/api/schema/quotes.ts');
console.log('Done quotes and service');
