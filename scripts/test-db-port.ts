
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function main() {
    const url = process.env.DATABASE_URL;
    console.log('Env URL:', url ? url.replace(/:[^:@]+@/, ':***@') : 'undefined');

    // Force connection to localhost:5433 to test Docker mapping
    const testUrl = url?.replace('localhost:5432', 'localhost:5433') || 'postgres://l2c_user:l2c_dev_password@localhost:5433/l2c_dev';

    console.log('Testing connection to:', testUrl.replace(/:[^:@]+@/, ':***@'));

    const sql = postgres(testUrl, { connect_timeout: 5 });

    try {
        const result = await sql`SELECT 1 as connected`;
        console.log('✅ Connection successful:', result);
    } catch (error) {
        console.error('❌ Connection failed:', error);
    } finally {
        await sql.end();
    }
}

main();
