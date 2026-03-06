const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');
let changedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    const regex = /import\s+([A-Za-z0-9_]+)\s+from\s+['"]lucide-react\/dist\/esm\/icons\/[^'"]+['"];?/g;

    const extractedIcons = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        extractedIcons.push(match[1]);
    }

    if (extractedIcons.length > 0) {
        // 1. Remove these imports
        content = content.replace(regex, '');

        // 2. See if there's already an `import { ... } from "lucide-react"`
        const barrelRegex = /import\s+\{\s*([^}]+?)\s*\}\s+from\s+['"]lucide-react['"];?/;
        const barrelMatch = barrelRegex.exec(content);

        if (barrelMatch) {
            const existingIcons = barrelMatch[1].split(',').map(s => s.trim()).filter(Boolean);
            const combined = Array.from(new Set([...existingIcons, ...extractedIcons]));
            content = content.replace(barrelRegex, `import { ${combined.join(', ')} } from 'lucide-react';`);
        } else {
            // Create new one at top
            content = `import { ${extractedIcons.join(', ')} } from 'lucide-react';\n` + content;
        }

        // Clean up excessive newlines
        content = content.replace(/\n{3,}/g, '\n\n');
        // Remove blank lines at the beginning of the file if any
        content = content.replace(/^\s*\n/, '');

        fs.writeFileSync(file, content);
        changedCount++;
    }
}
console.log(`Reverted imports in ${changedCount} files.`);
