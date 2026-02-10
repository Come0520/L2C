
import 'dotenv/config';
import { db } from './src/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

const phone = process.argv[2];

if (!phone) {
    console.error('Please provide a phone number');
    process.exit(1);
}

async function checkUser() {
    console.log(`Checking user with phone: ${phone}`);

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.phone, phone)
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
    } catch (e) {
        console.error('Error querying user:', e);
    }
}

checkUser().catch(console.error).finally(() => process.exit(0));
