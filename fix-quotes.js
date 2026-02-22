const fs = require('fs');
const path = require('path');

function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!filePath.includes('__tests__')) {
                findFiles(filePath, fileList);
            }
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = findFiles(path.join(__dirname, 'src', 'features', 'quotes'));

let consoleCount = 0;
let tsExpectCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // 1. Replace console.error and console.warn with logger
    if (content.match(/console\.(error|warn)/)) {
        content = content.replace(/console\.error/g, 'logger.error')
            .replace(/console\.warn/g, 'logger.warn');

        // Add logger import if missing
        if (!content.includes('import { logger }') && !content.includes('import logger')) {
            // find last import
            const importMatches = [...content.matchAll(/^import .* from .*;/gm)];
            if (importMatches.length > 0) {
                const lastMatch = importMatches[importMatches.length - 1];
                const lastImportIndex = lastMatch.index + lastMatch[0].length;
                content = content.slice(0, lastImportIndex) + "\nimport { logger } from '@/shared/lib/logger';" + content.slice(lastImportIndex);
            } else {
                content = "import { logger } from '@/shared/lib/logger';\n" + content;
            }
        }
        consoleCount++;
    }

    // 2. Fix specific @ts-ignore and @ts-expect-error
    if (content.includes('@ts-expect-error') || content.includes('@ts-ignore')) {
        // We handle the specific known cases

        // a) compare-utils.ts (just a comment issue)
        if (file.includes('compare-utils.ts')) {
            content = content.replace('Removed @ts-ignore', 'Removed ts-ignore annotation');
        }

        // b) quote-detail.tsx
        if (file.includes('quote-detail.tsx')) {
            // // @ts-expect-error - Expected structural mismatch
            // allItems,
            content = content.replace(
                /\/\/\s*@ts-expect-error\s*-\s*Expected structural mismatch\n\s*allItems,/g,
                `allItems as Parameters<typeof checkDiscountRisk>[0],`
            );

            // // @ts-expect-error - Type mismatched across quote PDF layout
            // quote={quote}
            content = content.replace(
                /\/\/\s*@ts-expect-error\s*-\s*Type mismatched across quote PDF layout\n\s*quote=\{quote\}/g,
                `quote={quote as React.ComponentProps<typeof QuotePdfDownloader>['quote']}`
            );
        }

        // c) quote-pdf-downloader.tsx
        if (file.includes('quote-pdf-downloader.tsx')) {
            content = content.replace(
                /\{\/\*\s*@ts-ignore\s*-\s*known issue with react-pdf types vs react 18\/19\s*\*\/\}/g,
                `{/* Known issue with react-pdf types vs react 18/19 */}`
            );
        }

        tsExpectCount++;
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
}

console.log(`Finished processing. Modified ${consoleCount} files for console, ${tsExpectCount} files for ts-expect-error.`);
