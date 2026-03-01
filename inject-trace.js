const fs = require('fs');
const path = require('path');

const files = [
    'src/features/quotes/actions/quote-crud.ts',
    'src/features/quotes/actions/quote-item-crud.ts',
    'src/features/quotes/actions/quote-lifecycle-actions.ts'
];

for (const f of files) {
    const fullPath = path.join(process.cwd(), f);
    let code = fs.readFileSync(fullPath, 'utf8');

    if (!code.includes("import crypto")) {
        code = code.replace(/'use server';\n+/, "'use server';\n\nimport crypto from 'crypto';\n");
    }

    const actionRegex = /(export\s+const\s+\w+\s*=\s*createSafeAction\([\s\S]*?,\s*async\s*\((.*?)\)\s*=>\s*\{)([\s\S]*?)(\n\}\);)/g;

    code = code.replace(actionRegex, (match, prefix, params, body, suffix) => {
        if (body.includes('crypto.randomUUID')) {
            return match;
        }

        let newBody = '\n  const traceId = crypto.randomUUID().slice(0, 8);' + body;

        newBody = newBody.replace(/logger\.(info|warn|error)\(\s*'([^']*)'([\s\S]*?)\)(;|(?:(?=\n)))/g, (logMatch, level, msg, argsStr, endChar) => {
            let newMsg = msg.startsWith('[quotes]') ? `[\${traceId}] ${msg}` : `[\${traceId}] [quotes] ${msg}`;

            let newArgs = argsStr.trim();
            if (!newArgs) {
                newArgs = `, { traceId }`;
            } else if (newArgs.startsWith(',')) {
                let inside = newArgs.substring(1).trim();
                if (inside.startsWith('{') && inside.endsWith('}')) {
                    newArgs = `, { traceId, ` + inside.substring(1);
                } else {
                    newArgs = `, { traceId }, ${inside}`;
                }
            }
            return `logger.${level}(\`${newMsg}\`${newArgs})${endChar}`;
        });

        return prefix + newBody + suffix;
    });

    fs.writeFileSync(fullPath, code);
    console.log('Processed', f);
}
console.log('Script finished successfully.');
