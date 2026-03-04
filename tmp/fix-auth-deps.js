const fs = require('fs');
const path = require('path');

const filesToRefactor = [
    'src/app/api/miniprogram/upload/route.ts',
    'src/app/api/miniprogram/tenant/status/route.ts',
    'src/app/api/miniprogram/tenant/payment-config/route.ts',
    'src/app/api/miniprogram/tasks/[id]/route.ts',
    'src/app/api/miniprogram/tasks/[id]/negotiate/route.ts',
    'src/app/api/miniprogram/tasks/[id]/measure-verify/route.ts',
    'src/app/api/miniprogram/tasks/route.ts',
    'src/app/api/miniprogram/payment/config/route.ts',
    'src/app/api/miniprogram/log/error/route.ts',
    'src/app/api/miniprogram/invite/list/route.ts',
    'src/app/api/miniprogram/engineer/schedule/route.ts',
    'src/app/api/miniprogram/invite/generate/route.ts',
];

for (const relPath of filesToRefactor) {
    const absPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(absPath)) continue;

    let content = fs.readFileSync(absPath, 'utf8');

    // Replace getMiniprogramUser declarations
    content = content.replace(/\s*const\s+(?:user|tokenData|authUser)\s*=\s*await\s+getMiniprogramUser\(\s*request\s*\);/g, '');

    content = content.replace(/\s*if\s*\(\!user\s*(?:\|\|[^\)]+)?\)\s*\{\s*return\s+apiUnauthorized\(.*?\);\s*\}/g, '');
    content = content.replace(/\s*if\s*\(\!tokenData\s*.*?\)\s*\{\s*return\s+apiUnauthorized\(.*?\);\s*\}/g, '');
    content = content.replace(/\s*if\s*\(\!authUser\s*.*?\)\s*\{\s*return\s+apiUnauthorized\(.*?\);\s*\}/g, '');

    // For `authUser`, we need to rename `authUser` to `user` in the body
    if (content.includes('authUser')) {
        content = content.replace(/\bauthUser\b/g, 'user');
    }
    // For `tokenData`, we need to rename `tokenData` to `user` in the body
    if (content.includes('tokenData')) {
        content = content.replace(/\btokenData\b/g, 'user');
    }

    fs.writeFileSync(absPath, content, 'utf8');
    console.log('Fixed', relPath);
}
