const postgres = require('/app/node_modules/postgres');
const sql = postgres(process.env.DATABASE_URL);

async function checkEnum() {
    const result = await sql`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'verification_code_type' ORDER BY enumsortorder;`;
    console.log('--- ENUMS ---');
    result.forEach(row => console.log(row.enumlabel));
    console.log('-------------');
    process.exit(0);
}

checkEnum().catch(err => {
    console.error(err);
    process.exit(1);
});
