import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

// 生成随机ID的简单函数
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET() {
  try {
    const supabase = await createClient();

    console.log('✅ 已连接到Supabase数据库');

    // 1. 获取现有的用户数据，如果没有则创建
    console.log('📝 获取或创建用户数据...');
    let { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, role');

    if (usersError) {
      throw new Error(`获取用户数据失败: ${usersError.message}`);
    }

    // 如果没有用户数据，创建一些基础用户
    if (!users || users.length === 0) {
      console.log('   没有找到用户数据，正在创建基础用户...');
      
      // 创建管理员用户
      const { error: adminError } = await supabase
        .from('users')
        .insert({
          name: '管理员',
          email: 'admin@example.com',
          phone: '13800000001',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (adminError) {
        throw new Error(`创建管理员用户失败: ${adminError.message}`);
      }

      // 创建销售用户
      const { error: salesError } = await supabase
        .from('users')
        .insert({
          name: '销售经理',
          email: 'sales@example.com',
          phone: '13800000002',
          role: 'sales',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (salesError) {
        throw new Error(`创建销售用户失败: ${salesError.message}`);
      }

      // 创建设计师用户
      const { error: designerError } = await supabase
        .from('users')
        .insert({
          name: '设计师',
          email: 'designer@example.com',
          phone: '13800000003',
          role: 'designer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (designerError) {
        throw new Error(`创建设计师用户失败: ${designerError.message}`);
      }

      // 重新获取用户数据
      const { data: newUsers, error: newUsersError } = await supabase
        .from('users')
        .select('id, name, role');

      if (newUsersError) {
        throw new Error(`重新获取用户数据失败: ${newUsersError.message}`);
      }

      users = newUsers;
      console.log('   基础用户创建完成');
    }

    const sales = users.filter(u => u.role === 'sales' || u.role === 'admin');
    const designers = users.filter(u => u.role === 'designer' || u.role === 'admin');

    if (sales.length === 0) {
      throw new Error('没有找到销售角色的用户，请先创建销售用户');
    }

    // 2. 创建或获取客户数据
    console.log('📝 创建客户数据...');
    let customers = [];

    // 先检查是否已有客户数据
    const { data: existingCustomers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(120);

    if (customersError) {
      throw new Error(`获取客户数据失败: ${customersError.message}`);
    }

    if (existingCustomers && existingCustomers.length >= 120) {
      customers = existingCustomers;
      console.log('   使用现有客户数据');
    } else {
      // 创建新客户
      for (let i = 1; i <= 120; i++) {
        const customerName = `测试${i}`;
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            phone: `138000000${String(i).padStart(2, '0')}`,
            address: `${customerName}的地址`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error(`创建客户 ${customerName} 失败: ${insertError.message}`);
          continue;
        }

        customers.push(newCustomer);
      }
      console.log('   已创建新客户数据');
    }

    // 3. 生成并插入订单数据
    console.log('📝 开始生成订单数据...');

    let customerIndex = 0;
    let ordersCreated = 0;

    for (const status of orderStatuses) {
      console.log(`   生成状态为 ${status} 的订单...`);

      for (let i = 1; i <= 10; i++) {
        const customer = customers[customerIndex++ % customers.length];
        const salesPerson = sales[Math.floor(Math.random() * sales.length)];
        const designer = designers[Math.floor(Math.random() * designers.length)];

        const orderData = {
          sales_no: `SO${Date.now()}${String(i).padStart(3, '0')}`,
          order_no: `ORD${Date.now()}${String(i).padStart(3, '0')}`,
          customer_id: customer.id,
          sales_id: salesPerson.id,
          designer_id: designer.id,
          designer_name: designer.name,
          sales_person_name: salesPerson.name,
          status: status,
          project_address: `${customer.name}的项目地址`,
          create_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // 根据订单状态设置相应的时间字段
        if (status === 'push_order_confirmed') {
          orderData.push_order_confirmed_at = new Date().toISOString();
          orderData.push_order_confirmed_by_id = salesPerson.id;
        } else if (status === 'payment_confirmed') {
          orderData.push_order_confirmed_at = new Date().toISOString();
          orderData.push_order_confirmed_by_id = salesPerson.id;
          orderData.payment_confirmed_at = new Date().toISOString();
          orderData.payment_confirmed_by_id = salesPerson.id;
        } else if (status === 'plan_confirmed') {
          orderData.push_order_confirmed_at = new Date().toISOString();
          orderData.push_order_confirmed_by_id = salesPerson.id;
          orderData.payment_confirmed_at = new Date().toISOString();
          orderData.payment_confirmed_by_id = salesPerson.id;
          orderData.plan_confirmed_at = new Date().toISOString();
          orderData.plan_confirmed_by_id = designer.id;
        }

        const { error: orderError } = await supabase
          .from('sales_orders')
          .insert(orderData);

        if (orderError) {
          console.error(`创建订单失败: ${orderError.message}`);
          continue;
        }

        ordersCreated++;
      }
    }

    console.log(`✅ 订单数据生成完成，共创建了 ${ordersCreated} 个订单`);

    return NextResponse.json({
      success: true,
      message: `成功生成了 ${ordersCreated} 个订单，每个状态10个订单`,
      ordersCreated: ordersCreated
    });

  } catch (error) {
    console.error('❌ 发生错误：', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '发生未知错误',
      error: error instanceof Error ? error.stack : undefined
    }, {
      status: 500
    });
  }
}
