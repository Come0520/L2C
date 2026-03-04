const fs = require('fs');
const files = [
    'src/app/api/miniprogram/engineer/schedule/route.ts',
    'src/app/api/miniprogram/invite/generate/route.ts',
    'src/app/api/miniprogram/invite/list/route.ts',
    'src/app/api/miniprogram/log/error/route.ts',
    'src/app/api/miniprogram/payment/config/route.ts',
    'src/app/api/miniprogram/tasks/[id]/measure-verify/route.ts',
    'src/app/api/miniprogram/tasks/[id]/negotiate/route.ts',
    'src/app/api/miniprogram/tasks/[id]/route.ts',
    'src/app/api/miniprogram/tasks/route.ts',
    'src/app/api/miniprogram/tenant/payment-config/route.ts',
    'src/app/api/miniprogram/tenant/status/route.ts',
    'src/app/api/miniprogram/upload/route.ts'
];

for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('getMiniprogramUser') && !content.includes("import { getMiniprogramUser }")) {
        content = "import { getMiniprogramUser } from '@/app/api/miniprogram/auth-utils';\n" + content;
        fs.writeFileSync(f, content);
    }
}
console.log('Fixed imports');
