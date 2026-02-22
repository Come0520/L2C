import { db } from './src/shared/api/db';
import { users } from './src/shared/api/schema';

async function main() {
    const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        roles: users.roles,
    }).from(users);

    for (const u of allUsers) {
        console.log(`User: ${u.name} | email: ${u.email} | role: ${u.role} | roles: ${JSON.stringify(u.roles)}`);
    }
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
