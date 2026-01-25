
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
    console.log('Fixing DB Schema...');

    const { db } = await import('../src/shared/api/db');
    const { sql } = await import('drizzle-orm');

    try {
        console.log('Applying tenants table hotfixes...');

        const commands = [
            // Tenants table missing columns
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'active'`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applicant_name varchar(100)`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applicant_phone varchar(20)`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applicant_email varchar(255)`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS region varchar(100)`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_description text`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reviewed_by uuid`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reject_reason text`,
            sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb`,

            // Users table missing columns (just in case)
            sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin boolean DEFAULT false`,
            sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{}'::jsonb`,
        ];

        for (const cmd of commands) {
            try {
                await db.execute(cmd);
                // console.log('Executed:', cmd.queryChunks[0].value[0]); 
            } catch (e: any) {
                console.log('Warning/Skipped:', e.message);
            }
        }

        console.log('Schema fix completed.');
        process.exit(0);
    } catch (e: any) {
        console.error('Fatal Error:', e);
        process.exit(1);
    }
}

main();
