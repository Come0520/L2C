// 直接连接数据库并插入模拟订单数据
const { Client } = require('pg');

// 数据库连接配置
const client = new Client({
  host: 'localhost',
  port: 54322, // 根据config.toml中的db.port配置
  user: 'postgres',
  password: 'postgres', // 默认密码
  database: 'postgres'
});

async function seedDatabase() {
  try {
    // 连接到数据库
    await client.connect();
    console.log('✅ 已连接到数据库');

    // 创建测试用户（如果不存在）
    console.log('🔄 创建测试用户...');
    await client.query(`
      INSERT INTO "users" ("id", "phone", "name", "role", "created_at", "updated_at")
      VALUES 
        ('00000000-0000-0000-0000-000000000001', '13800000001', '测试用户1', 'customer', now(), now()),
        ('00000000-0000-0000-0000-000000000002', '13800000002', '测试用户2', 'customer', now(), now()),
        ('00000000-0000-0000-0000-000000000003', '13800000003', '测试用户3', 'customer', now(), now()),
        ('00000000-0000-0000-0000-000000000004', '13800000004', '测试用户4', 'customer', now(), now()),
        ('00000000-0000-0000-0000-000000000005', '13800000005', '测试用户5', 'customer', now(), now()),
        ('00000000-0000-0000-0000-000000000011', '13800000011', '销售1', 'sales', now(), now()),
        ('00000000-0000-0000-0000-000000000012', '13800000012', '销售2', 'sales', now(), now()),
        ('00000000-0000-0000-0000-000000000013', '13800000013', '销售3', 'sales', now(), now())
      ON CONFLICT ("phone") DO NOTHING
    `);
    console.log('✅ 测试用户创建完成');

    // 定义所有订单状态
    const orderStatuses = [
      'pending_assignment', 'pending_tracking', 'tracking', 'draft_signed', 'pending_measurement',
      'measuring_pending_assignment', 'measuring_assigning', 'measuring_pending_visit',
      'measuring_pending_confirmation', 'plan_pending_confirmation', 'pending_push',
      'pending_order', 'in_production', 'stock_prepared', 'pending_shipment', 'shipped',
      'installing_pending_assignment', 'installing_assigning', 'installing_pending_visit',
      'installing_pending_confirmation', 'delivered', 'pending_reconciliation',
      'pending_invoice', 'pending_payment', 'completed', 'cancelled', 'suspended', 'exception'
    ];

    // 为每个状态插入10条模拟订单
    console.log('🔄 插入模拟订单数据...');
    for (const status of orderStatuses) {
      console.log(`  ⚙️  正在处理状态: ${status}`);
      for (let i = 1; i <= 10; i++) {
        await client.query(`
          INSERT INTO "orders" ("id", "sales_no", "customer_id", "sales_id", "total_amount", "status", "created_at", "updated_at")
          VALUES (
            gen_random_uuid(),
            'SO' || to_char(now(), 'YYYYMMDD') || lpad(($1::text), 3, '0'),
            -- 随机选择客户
            (SELECT "id" FROM "users" WHERE "role" = 'customer' ORDER BY random() LIMIT 1),
            -- 随机选择销售
            (SELECT "id" FROM "users" WHERE "role" = 'sales' ORDER BY random() LIMIT 1),
            -- 随机金额（1000-10000）
            floor(random() * 9000 + 1000),
            $2,
            now() - (random() * INTERVAL '30 days'), -- 随机创建时间（过去30天内）
            now() - (random() * INTERVAL '30 days')  -- 随机更新时间（过去30天内）
          )
        `, [i, status]);
      }
    }

    console.log('✅ 模拟订单数据插入完成');

    // 查询各状态的订单数量，验证插入结果
    console.log('🔍 验证插入结果:');
    const result = await client.query(`
      SELECT "status", COUNT(*) as "count"
      FROM "orders"
      GROUP BY "status"
      ORDER BY "count" DESC
    `);
    result.rows.forEach(row => {
      console.log(`  📊 ${row.status}: ${row.count} 条订单`);
    });

    console.log('🎉 数据库种子数据插入完成！');
  } catch (error) {
    console.error('❌ 插入数据时出错:');
    console.error('  - 错误信息:', error.message);
    console.error('  - 错误堆栈:', error.stack);
    if (error.code) {
      console.error('  - 错误代码:', error.code);
    }
    if (error.detail) {
      console.error('  - 错误详情:', error.detail);
    }
    if (error.hint) {
      console.error('  - 错误提示:', error.hint);
    }
  } finally {
    // 断开数据库连接
    await client.end();
    console.log('🔌 已断开数据库连接');
  }
}

// 执行种子数据插入
seedDatabase();