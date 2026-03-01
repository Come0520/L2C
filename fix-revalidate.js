const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) {
            walk(full);
        } else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
            let cnt = fs.readFileSync(full, 'utf8');
            if (cnt.includes('revalidateTag')) {
                // To safely replace `revalidateTag('quotes')` with `revalidateTag('quotes', 'default')`
                // Ensure we don't touch calls that already have 'default'
                const replaced = cnt.replace(/revalidateTag\((['"][\w-/:]+['"])\)/g, "revalidateTag($1, 'default')");
                if (replaced !== cnt) {
                    console.log('Fixed:', full);
                    fs.writeFileSync(full, replaced);
                }
            }
        }
    });
}

const targetDir = path.join(__dirname, 'src');
console.log('Scanning', targetDir);
walk(targetDir);
