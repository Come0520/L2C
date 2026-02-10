import { config } from 'dotenv';
config({ path: '.env' }); // 强制加载 .env

import postgres from 'postgres';

async function checkConnection() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    // 简单的脱敏打印
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`Using DATABASE_URL: ${maskedUrl}`);

    const sql = postgres(dbUrl);

    try {
        console.log('Connecting...');
        const res = await sql`SELECT NOW()`;
        console.log('Connected successfully!');
        console.log('Current time from DB:', res[0].now);

        await sql.end();
        process.exit(0);
    } catch (err: any) {
        console.error('Connection failed:', err.message);
        console.log('Full error:', err);
        process.exit(1);
    }
}

checkConnection();
