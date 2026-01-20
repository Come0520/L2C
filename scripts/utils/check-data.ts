import 'dotenv/config';
import { db } from './src/shared/api/db';

async function main() {
    console.log('🔍 Checking Tenants and Users...\n');

    const tenants = await db.query.tenants.findMany({
        with: {
            users: true
        }
    });

    console.log(`🏢 Tenants Total: ${tenants.length}`);

    for (const t of tenants) {
        console.log(`\n================================`);
        console.log(`🏢 Tenant: [${t.code}] ${t.name}`);
        console.log(`   ID: ${t.id}`);
        console.log(`   Users (${t.users.length}):`);

        // List first 5 users + Manager/Admin
        const admins = t.users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
        const others = t.users.filter(u => u.role !== 'MANAGER' && u.role !== 'ADMIN').slice(0, 5);

        [...admins, ...others].forEach(u => {
            console.log(`     - ${u.name} (${u.role}) Phone: ${u.phone}`);
        });

        if (t.users.length > (admins.length + 5)) {
            console.log(`     ... and ${t.users.length - admins.length - 5} more`);
        }
    }

    process.exit(0);
}

main().catch(console.error);