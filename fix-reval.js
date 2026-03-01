const fs = require('fs');

const lines = fs.readFileSync('tsc-output.txt', 'utf8').split('\n').filter(Boolean);
let fixedFiles = new Set();

lines.forEach(l => {
    const match = l.match(/^(.+?)\((\d+),(\d+)\): error TS2554: Expected 2 arguments, but got 1\./);
    if (match) {
        const [_, file, line, col] = match;

        if (file.includes('quote-config.service.ts')) return;

        try {
            let content = fs.readFileSync(file, 'utf8').split('\n');
            let lineContent = content[line - 1];

            // Basic detection for revalidateTag that lacks the 2nd argument
            if (lineContent.includes('revalidateTag(') && !lineContent.includes("'default'") && !lineContent.includes('"default"')) {
                // We do a regex replace to insert , 'default' before the closing )
                // Note: this handles well-formed revalidateTag(something)
                content[line - 1] = lineContent.replace(/revalidateTag\(([^,]+?)\)/, "revalidateTag($1, 'default')");
                fs.writeFileSync(file, content.join('\n'));
                fixedFiles.add(file);
            }
        } catch (e) {
            console.error('Error processing', file, e);
        }
    }
});

console.log('Fixed files:', fixedFiles.size);
