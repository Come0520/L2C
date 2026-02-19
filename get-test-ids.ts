
import dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config();

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }
    const sql = postgres(process.env.DATABASE_URL);
    try {
        const tenantsList = await sql`SELECT id FROM tenants LIMIT 1`;
        const workersList = await sql`SELECT id FROM users WHERE role = 'WORKER' LIMIT 1`;
        const salesList = await sql`SELECT id FROM users WHERE role = 'SALES' LIMIT 1`;

        console.log('---RESULT_START---');
        console.log(JSON.stringify({
            tenantId: tenantsList[0]?.id,
            workerId: workersList[0]?.id,
            salesId: salesList[0]?.id
        }));
        console.log('---RESULT_END---');
    } catch (err) {
        console.error('Database error:', err);
    } finally {
        await sql.end();
    }
}
main();
