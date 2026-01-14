
import 'dotenv/config';

async function main() {
    console.log('Testing getLeads...');
    try {
        // Mock auth? getLeads calls auth().
        // We cannot easily mock auth() in script unless we mock the module.
        // Instead, we can verify db query directly.
        // Or we can modify getLeads to skip auth if env var set? No.

        // Let's test DB query directly.
        const { db } = await import('@/shared/api/db');
        const { leads } = await import('@/shared/api/schema');
        const count = await db.select().from(leads).limit(1);
        console.log('DB Connection OK. Leads count:', count.length);

    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

main();
