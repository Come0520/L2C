const fs = require('fs');

function safeAdd(file) {
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const out = [];
    let inTable = false;
    let hasCreatedBy = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('pgTable(')) {
            inTable = true;
            hasCreatedBy = false;
        }
        if (inTable && (line.includes("uuid('created_by')") || line.includes("createdBy:"))) {
            hasCreatedBy = true;
        }
        if (inTable && line.match(/createdAt:\s*timestamp/)) {
            if (!hasCreatedBy) {
                const indentMatch = line.match(/^(\s+)/);
                const indent = indentMatch ? indentMatch[1] : '';
                out.push(`${indent}// 审计字段 (H4 统一追加)`);
                out.push(`${indent}createdBy: uuid('created_by'),`);
                out.push(`${indent}updatedBy: uuid('updated_by'),`);
            }
            inTable = false; // Add once per table
        }
        out.push(line);
    }
    fs.writeFileSync(file, out.join('\n'));
    console.log('Fixed', file);
}

safeAdd('src/shared/api/schema/quotes.ts');
safeAdd('src/shared/api/schema/service.ts');
