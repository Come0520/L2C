const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            results.push(filePath);
        }
    });
    return results;
}

const dirs = ['src/features/finance', 'src/app/(dashboard)/finance', 'src/app/(main)/finance'];
let changedFiles = 0;
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = walk(dir);
    files.forEach(f => {
        let content = fs.readFileSync(f, 'utf8');
        if (content.includes('@/shared/components/ui/')) {
            content = content.replace(/@\/shared\/components\/ui\//g, '@/components/ui/');
            fs.writeFileSync(f, content, 'utf8');
            changedFiles++;
        }
    });
});
console.log('Fixed imports in ' + changedFiles + ' files.');
