/**
 * 临时调试脚本：检查 showroom_items 表的列结构及展厅素材的关联数据
 * 直接使用 postgres 连接，绕过 Drizzle ORM
 */
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    await client.connect();

    console.log('=== 1. showroom_items 表的列 ===');
    const columns = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'showroom_items' 
    ORDER BY ordinal_position
  `);
    columns.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));

    console.log('\n=== 2. 检查第一条展厅素材的关联字段 ===');
    const items = await client.query(`
    SELECT id, title, product_id, created_by, tenant_id, type, status
    FROM showroom_items 
    LIMIT 3
  `);
    items.rows.forEach(r => console.log(`  - ${r.id}: productId=${r.product_id}, createdBy=${r.created_by}`));

    if (items.rows.length > 0) {
        const firstItem = items.rows[0];

        if (firstItem.product_id) {
            console.log('\n=== 3. 检查关联 product 是否存在 ===');
            const product = await client.query(`SELECT id, name FROM products WHERE id = $1`, [firstItem.product_id]);
            console.log(`  products 表查询结果: ${product.rows.length} 条 (productId: ${firstItem.product_id})`);
        } else {
            console.log('\n=== 3. 第一条素材 productId 为 NULL，跳过关联检查 ===');
        }

        if (firstItem.created_by) {
            console.log('\n=== 4. 检查关联 creator (users) 是否存在 ===');
            const user = await client.query(`SELECT id, name FROM users WHERE id = $1`, [firstItem.created_by]);
            console.log(`  users 表查询结果: ${user.rows.length} 条 (userId: ${firstItem.created_by})`);
        }
    }

    console.log('\n=== 5. 最近10条 drizzle 迁移记录 ===');
    try {
        const migrations = await client.query(`
      SELECT tag, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 10
    `);
        migrations.rows.forEach(r => console.log(`  - ${r.created_at}: ${r.tag}`));
    } catch (e) {
        console.log('  迁移表查询失败:', e.message);
    }

    await client.end();
}

main().catch(e => { console.error('脚本报错:', e); process.exit(1); });
