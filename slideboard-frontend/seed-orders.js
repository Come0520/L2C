const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

// 配置数据库连接
const client = new Client({
  host: 'db.rdpiajialjnmngnaokix.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'L2C123456',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

// 订单状态列表
const orderStatuses = [
  'draft',
  'pending_push',
  'push_order_confirmed',
  'payment_confirmed',
  'plan_confirmed',
  'production_in_progress',
  'production_completed',
  'ready_for_installation',
  'installation_scheduled',
  'installation_completed',
  'invoice_issued',
  'completed'
];

// 生成模拟数据的函数
async function generateMockData() {
  try {
    // 连接到数据库
    await client.connect();
    console.log('✅ 已连接到数据库');

    // 1. 首先创建一些基础数据（用户、客户）
    console.log('📝 开始创建基础数据...');
    
    // 创建销售用户
    const salesUser = {
      id: uuidv4(),
      name: '销售经理',
      email: 'sales@example.com',
      phone: '13800138000',
      role: 'sales',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await client.query(
      `INSERT INTO users (id, name, email, phone, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO NOTHING`,
      [salesUser.id, salesUser.name, salesUser.email, salesUser.phone, salesUser.role, salesUser.created_at, salesUser.updated_at]
    );
    
    // 创建设计师用户
    const designerUser = {
      id: uuidv4(),
      name: '设计师',
      email: 'designer@example.com',
      phone: '13900139000',
      role: 'designer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await client.query(
      `INSERT INTO users (id, name, email, phone, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO NOTHING`,
      [designerUser.id, designerUser.name, designerUser.email, designerUser.phone, designerUser.role, designerUser.created_at, designerUser.updated_at]
    );
    
    // 创建客户数据
    for (let i = 1; i <= 120; i++) {
      const customer = {
        id: uuidv4(),
        name: `测试${i}`,
        phone: `138000000${String(i).padStart(2, '0')}`,
        address: `测试地址${i}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await client.query(
        `INSERT INTO customers (id, name, phone, address, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (id) DO NOTHING`,
        [customer.id, customer.name, customer.phone, customer.address, customer.created_at, customer.updated_at]
      );
    }
    
    console.log('✅ 基础数据创建完成');
    
    // 2. 获取客户和用户数据，用于关联订单
    const customersResult = await client.query('SELECT id, name FROM customers ORDER BY created_at LIMIT 120');
    const customers = customersResult.rows;
    
    const usersResult = await client.query('SELECT id, name, role FROM users');
    const users = usersResult.rows;
    const sales = users.filter(u => u.role === 'sales' || u.role === 'admin');
    const designers = users.filter(u => u.role === 'designer' || u.role === 'admin');
    
    // 3. 生成并插入订单数据
    console.log('📝 开始生成订单数据...');
    
    let customerIndex = 0;
    
    for (const status of orderStatuses) {
      console.log(`   生成状态为 ${status} 的订单...`);
      
      for (let i = 1; i <= 10; i++) {
        const customer = customers[customerIndex++];
        const salesPerson = sales[Math.floor(Math.random() * sales.length)];
        const designer = designers[Math.floor(Math.random() * designers.length)];
        
        const order = {
          id: uuidv4(),
          sales_no: `SO${Date.now()}${String(i).padStart(3, '0')}`,
          order_no: `ORD${Date.now()}${String(i).padStart(3, '0')}`,
          customer_id: customer.id,
          sales_id: salesPerson.id,
          designer_id: designer.id,
          designer_name: designer.name,
          sales_person_name: salesPerson.name,
          status: status,
          project_address: `${customer.name}的项目地址`,
          total_amount: Math.floor(Math.random() * 100000) + 50000, // 50000-150000之间的随机金额
          create_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // 根据订单状态设置相应的时间字段
        let extraFields = '';
        let extraValues = [];
        
        if (status === 'push_order_confirmed') {
          extraFields = ', push_order_confirmed_at, push_order_confirmed_by_id';
          extraValues = [new Date().toISOString(), salesPerson.id];
        } else if (status === 'payment_confirmed') {
          extraFields = ', push_order_confirmed_at, push_order_confirmed_by_id, payment_confirmed_at, payment_confirmed_by_id';
          extraValues = [new Date().toISOString(), salesPerson.id, new Date().toISOString(), salesPerson.id];
        } else if (status === 'plan_confirmed') {
          extraFields = ', push_order_confirmed_at, push_order_confirmed_by_id, payment_confirmed_at, payment_confirmed_by_id, plan_confirmed_at, plan_confirmed_by_id';
          extraValues = [new Date().toISOString(), salesPerson.id, new Date().toISOString(), salesPerson.id, new Date().toISOString(), designer.id];
        }
        
        // 构建插入SQL
        const sql = `
          INSERT INTO sales_orders (
            id, sales_no, order_no, customer_id, sales_id, designer_id, 
            designer_name, sales_person_name, status, project_address, 
            create_time, created_at, updated_at${extraFields}
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13${extraFields.split(',').map((_, idx) => `, $${14 + idx}`).join('')}
          )
        `;
        
        const values = [
          order.id, order.sales_no, order.order_no, order.customer_id, order.sales_id, order.designer_id,
          order.designer_name, order.sales_person_name, order.status, order.project_address,
          order.create_time, order.created_at, order.updated_at, ...extraValues
        ];
        
        await client.query(sql, values);
      }
    }
    
    console.log('✅ 订单数据生成完成');
    console.log('🎉 所有模拟数据已成功插入到数据库中！');
    
  } catch (error) {
    console.error('❌ 发生错误：', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

// 运行脚本
generateMockData();
