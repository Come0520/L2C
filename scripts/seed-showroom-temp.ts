import { db } from './src/shared/api/db';
import { tenants, users } from './src/shared/api/schema';
import { showroomItems } from './src/shared/api/schema/showroom';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

async function main() {
    const tenant = await db.query.tenants.findFirst();
    if (!tenant) throw new Error('No tenant found');
    const user = await db.query.users.findFirst({ where: eq(users.tenantId, tenant.id) });
    if (!user) throw new Error('No user found');

    console.log('Found tenant:', tenant.id, 'and user:', user.id);
}

main().catch(console.error);
