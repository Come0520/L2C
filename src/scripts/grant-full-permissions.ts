import 'dotenv/config';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const phone = '15601911921';
    console.log(`Checking user: ${phone}...`);

    // Check if DATABASE_URL is present
    if (!process.env.DATABASE_URL) {
        console.error("ERROR: DATABASE_URL is missing. Dotenv failed to load?");
        process.exit(1);
    }

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.phone, phone)
        });

        if (!user) {
            console.error(`User with phone ${phone} NOT FOUND.`);
            process.exit(1);
        }

        console.log(`User Found: ${user.name} (${user.email})`);

        // Grant all required roles and permissions
        // ADMIN is the superuser role in this system
        console.log('Granting ADMIN role and Platform Admin privileges...');
        await db.update(users)
            .set({
                role: 'ADMIN',
                roles: ['ADMIN'],
                isPlatformAdmin: true
            })
            .where(eq(users.id, user.id));

        console.log('✅ Successfully granted full privileges.');

    } catch (error) {
        console.error('Database Error:', error);
        process.exit(1);
    }
    process.exit(0);
}

main();
