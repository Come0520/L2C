const postgres = require('postgres');
const bcrypt = require('bcryptjs');

const sql = postgres('postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev');

async function main() {
    try {
        const users = await sql`SELECT * FROM users WHERE phone = '13800000001'`;

        if (users.length > 0) {
            console.log('User exists:', users[0].id);
            const hashedPassword = await bcrypt.hash('123456', 10);
            await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE phone = '13800000001'`;
            console.log('Password reset to 123456');
        } else {
            console.log('User does not exist. Creating...');
            const hashedPassword = await bcrypt.hash('123456', 10);
            await sql`
                INSERT INTO users (id, phone, password_hash, name, role, status, updated_at) 
                VALUES ('admin_test_1', '13800000001', ${hashedPassword}, '测试管理员', 'ADMIN', 'ACTIVE', NOW())
            `;
            console.log('User created.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}
main();
