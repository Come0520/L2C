const postgres = require('postgres');
const sql = postgres('postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev');

async function main() {
    try {
        await sql`UPDATE users SET is_platform_admin = true WHERE phone = '13800000001'`;
        console.log('User 13800000001 is now platform admin.');
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}
main();
