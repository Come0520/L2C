const postgres = require('/app/node_modules/postgres');
const sql = postgres(process.env.DATABASE_URL);

async function run() {
    try {
        await sql`ALTER TYPE verification_code_type ADD VALUE IF NOT EXISTS 'MAGIC_LOGIN';`;
        console.log("ENUM MAGIC_LOGIN ADDED");
    } catch (err) {
        console.log("Error adding enum:", err.message);
    } finally {
        process.exit(0);
    }
}

run().catch(console.error);
