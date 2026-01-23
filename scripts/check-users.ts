import 'dotenv/config';
import { db } from '@/shared/api/db';

async function main() {
    const users = await db.query.users.findMany();
    const tenants = await db.query.tenants.findMany();

    console.log('可用登录账户:');
    console.log('='.repeat(80));

    for (const u of users) {
        const t = tenants.find(t => t.id === u.tenantId);
        console.log(`电话: ${u.phone} | 名称: ${u.name} | 租户: ${t?.name || 'Unknown'}`);
    }

    process.exit(0);
}

main().catch(console.error);
