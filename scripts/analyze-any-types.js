const fs = require('fs');
const path = require('path');

const reportPath = path.join(process.cwd(), 'eslint-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const srcFiles = report.filter(file => file.filePath.includes(path.join(process.cwd(), 'src')));

const anyTypeCounts = srcFiles.map(file => {
    const anyCount = file.messages.filter(msg => msg.ruleId === '@typescript-eslint/no-explicit-any').length;
    return {
        filePath: file.filePath,
        count: anyCount
    };
}).filter(file => file.count > 0);

anyTypeCounts.sort((a, b) => b.count - a.count);

console.log('Top 20 files with no-explicit-any in src/:');
anyTypeCounts.slice(0, 20).forEach(file => {
    console.log(`${file.count}\t${path.relative(process.cwd(), file.filePath)}`);
});

const totalAny = anyTypeCounts.reduce((sum, file) => sum + file.count, 0);
console.log(`\nTotal no-explicit-any in src/: ${totalAny}`);
