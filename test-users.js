const postgres = require('postgres');
const sql = postgres('postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev');

async function main() {
    try {
        const users = await sql`SELECT id, phone, name, role, tenant_id FROM users LIMIT 10`;
        console.log('Users:', users);
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}
main();
