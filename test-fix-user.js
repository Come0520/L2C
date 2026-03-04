const postgres = require('postgres');
const sql = postgres('postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev');

async function main() {
    try {
        // 1. 查询测试用户的当前状态
        const users = await sql`SELECT id, phone, tenant_id, is_platform_admin, role FROM users WHERE phone = '13800000001'`;
        console.log('当前测试用户信息:', JSON.stringify(users, null, 2));

        // 2. 查询所有 tenant 列表
        const tenants = await sql`SELECT id, name FROM tenants LIMIT 5`;
        console.log('可用 Tenants:', JSON.stringify(tenants, null, 2));

        if (users.length === 0) {
            console.error('未找到测试用户！');
            return;
        }

        const user = users[0];
        if (!user.tenant_id && tenants.length > 0) {
            // 如果没有 tenantId，分配第一个 tenant
            const targetTenantId = tenants[0].id;
            await sql`UPDATE users SET is_platform_admin = false, tenant_id = ${targetTenantId} WHERE phone = '13800000001'`;
            console.log(`已设置用户 tenant_id = ${targetTenantId}，关闭 isPlatformAdmin`);
        } else {
            // 只关闭 isPlatformAdmin，保留现有 tenantId
            await sql`UPDATE users SET is_platform_admin = false WHERE phone = '13800000001'`;
            console.log(`已关闭 isPlatformAdmin，tenant_id 保持: ${user.tenant_id}`);
        }

        // 3. 验证
        const updated = await sql`SELECT id, username, phone, tenant_id, is_platform_admin, role FROM users WHERE phone = '13800000001'`;
        console.log('修改后用户信息:', JSON.stringify(updated, null, 2));
    } catch (e) {
        console.error('错误:', e.message);
    } finally {
        await sql.end();
    }
}
main();
