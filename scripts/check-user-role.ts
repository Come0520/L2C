
import { db } from '@/shared/api/db';
import { users, roles } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

const phone = process.argv[2];

if (!phone) {
    console.error('Please provide a phone number');
    process.exit(1);
}

async function checkUser() {
    console.log(`Checking user with phone: ${phone}`);
    const user = await db.query.users.findFirst({
        where: eq(users.mobile, phone),
        with: {
            roleRef: true
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User found:');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Mobile: ${user.mobile}`);
    console.log(`Role (Code): ${user.role}`);
    console.log(`TenantId: ${user.tenantId}`);

    if (user.roleRef) {
        console.log('Role Definition:', user.roleRef);
    } else {
        console.log('No Role Reference found in relation.');
    }
}

checkUser().catch(console.error).finally(() => process.exit(0));
