
import fs from 'fs';
import path from 'path';

// 1. MUST load env before any app imports
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        // improved parsing to handle comments and complex values if needed, but simple split is okay for this task
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // removed quotes
            if (key && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
}

// 2. Now import app modules
// using dynamic import to ensure env is set first
async function main() {
    const { db } = await import('@/shared/api/db');
    const { users } = await import('@/shared/api/schema');
    const { eq } = await import('drizzle-orm');

    const phone = '15601911921';
    console.log(`Checking user with phone: ${phone}...`);

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.phone, phone),
            columns: {
                id: true,
                name: true,
                role: true,
                isPlatformAdmin: true,
                tenantId: true
            }
        });

        if (user) {
            console.log('User found:', JSON.stringify(user, null, 2));
        } else {
            console.log('User not found.');
        }
    } catch (error) {
        console.error('Error querying database:', error);
    }
    process.exit(0);
}

main();
