const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}
const files = walk('./src/features/quotes');
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    if (content.includes('updateTag')) {
        content = content.replace(/import\s*\{([^}]*)updateTag([^}]*)\}\s*from\s*['\"]next\/cache['\"];?/g, (match, prefix, suffix) => {
            if (!prefix.includes('revalidateTag') && !suffix.includes('revalidateTag')) {
                return `import { ${prefix}revalidateTag${suffix} } from 'next/cache';`;
            }
            return `import { ${prefix}${suffix} } from 'next/cache';`;
        });

        content = content.replace(/updateTag\(([^)]+)\)/g, 'revalidateTag($1, \'default\')');
        fs.writeFileSync(file, content);
        count++;
        console.log('Fixed:', file);
    }
});
console.log('Total fixed:', count);
