const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '../src/shared/api/schema');

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Clean up ALL bad injections from previous scripts
    // We use regex to match the exact pattern regardless of indentation
    const badInjectionRegex = /[ \t]*\/\/\s*审计字段\s*\(H4 统一追加\)\r?\n[ \t]*createdBy:\s*uuid\('created_by'\),\r?\n[ \t]*updatedBy:\s*uuid\('updated_by'\),?\r?\n/g;

    let cleanedContent = content.replace(badInjectionRegex, '');

    // 2. Safe Line-by-Line Addition
    const lines = cleanedContent.split(/\r?\n/);
    const out = [];
    let inTable = false;
    let hasCreatedBy = false;
    let hasChanges = content !== cleanedContent;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('pgTable(')) {
            inTable = true;
            hasCreatedBy = false;
        }
        // Detect if table already has createdBy
        if (inTable && (line.includes("uuid('created_by')") || line.includes("createdBy:") || line.includes("createdBy :"))) {
            hasCreatedBy = true;
        }

        // Inject right before createdAt if safe
        if (inTable && line.match(/createdAt:\s*timestamp/)) {
            if (!hasCreatedBy) {
                const indentMatch = line.match(/^([ \t]+)/);
                const indent = indentMatch ? indentMatch[1] : '';
                out.push(`${indent}// 审计字段 (H4 统一追加)`);
                out.push(`${indent}createdBy: uuid('created_by'),`);
                out.push(`${indent}updatedBy: uuid('updated_by'),`);
                hasChanges = true;
            }
            inTable = false; // Reset for next table
        }
        out.push(line);
    }

    let finalContent = out.join('\n');

    // 3. Ensure `uuid` is imported if we made changes
    if (hasChanges && finalContent.includes("uuid('created_by')") && !finalContent.includes('uuid,')) {
        finalContent = finalContent.replace(/(from\s*'drizzle-orm\/pg-core';)/, "$1 /* needs uuid, added below */");
        const importRegex = /import\s*\{([\s\S]*?)\}\s*from\s*'drizzle-orm\/pg-core'/;
        if (importRegex.test(finalContent)) {
            finalContent = finalContent.replace(importRegex, (match, p1) => {
                if (!p1.includes('uuid')) {
                    return match.replace(p1, p1 + '\n  uuid,');
                }
                return match;
            });
        }
    }

    fs.writeFileSync(file, finalContent, 'utf8');
}

const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'relations.ts' && f !== 'enums.ts');
for (const f of files) {
    processFile(path.join(schemaDir, f));
}

console.log('✅ Clean and safe add complete!');
