const postgres = require('postgres');
const sql = postgres('postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev');

async function main() {
    try {
        const users = await sql`SELECT id, is_active, tenant_id, is_platform_admin, role FROM users WHERE phone='13800000001'`;
        console.log('User status:', users);
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}
main();
