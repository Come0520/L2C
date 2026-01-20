import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/shared/api/schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seedReminderRules() {
    console.log('正在创建线索提醒规则...');

    // 获取默认租户
    const tenants = await db.select().from(schema.tenants).limit(1);
    if (tenants.length === 0) {
        console.error('错误：未找到租户');
        process.exit(1);
    }
    const tenantId = tenants[0].id;

    // 规则1: 待分配超时提醒
    await db.insert(schema.reminderRules).values({
        tenantId,
        module: 'LEAD',
        ruleName: '线索分配超时提醒',
        triggerCondition: {
            field: 'status',
            op: 'eq',
            value: 'PENDING_DISPATCH',
            hoursOverdue: 12,
        },
        channels: ['IN_APP'],
        recipients: { type: 'ROLE', roleId: 'DISPATCHER' }, // 通知调度员
        isActive: true,
    });
    console.log('✅ 规则1：待分配线索 12 小时超时提醒 - 已创建');

    // 规则2: 待跟进超时提醒
    await db.insert(schema.reminderRules).values({
        tenantId,
        module: 'LEAD',
        ruleName: '线索跟进超时提醒',
        triggerCondition: {
            field: 'status',
            op: 'eq',
            value: 'PENDING_FOLLOWUP',
            hoursOverdue: 8,
        },
        channels: ['IN_APP'],
        recipients: { type: 'ASSIGNEE' }, // 通知指派的销售
        isActive: true,
    });
    console.log('✅ 规则2：待跟进线索 8 小时超时提醒 - 已创建');

    console.log('\n🎉 线索提醒规则创建完成！');
    process.exit(0);
}

seedReminderRules().catch((err) => {
    console.error('创建失败:', err);
    process.exit(1);
});
