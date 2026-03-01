const fs = require('fs');
const path = require('path');

function processDir(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            const regex1 = /revalidateTag\('([^']+)'\);/g;
            if (regex1.test(content)) {
                content = content.replace(regex1, "revalidateTag('$1', {});");
                changed = true;
            }

            const regex2 = /revalidateTag\('([^']+)', 'default'\);/g;
            if (regex2.test(content)) {
                content = content.replace(regex2, "revalidateTag('$1', {});");
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed ' + fullPath);
            }
        }
    }
}

processDir('src/features/quotes/actions');
processDir('src/features/quotes/components');
