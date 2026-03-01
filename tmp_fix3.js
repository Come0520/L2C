const fs = require('fs');
const files = [
    'src/features/finance/actions/ap.ts',
    'src/features/finance/actions/ar.ts'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/revalidateTag\(([^,]+?)\)/g, 'revalidateTag($1, undefined as any)');
    fs.writeFileSync(file, content);
});

console.log('Fixed revalidateTag');
