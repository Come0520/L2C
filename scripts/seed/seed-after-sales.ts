import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/shared/api/schema';
import { generateDocNo } from './src/shared/lib/utils';
import fs from 'fs';
import path from 'path';

// Manual .env parser needed since we are running standalone
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return;
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                if (key && val) process.env[key] = val;
            }
        });
    } catch (e) {
        console.warn('Failed to load .env.local', e);
    }
}
loadEnv();

async function seed() {
    console.log('🌱 Seeding After-Sales Mock Data...');

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not found in .env.local');
    }

    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client, { schema });

    try {
        // 1. Ensure Tenant & User (Reuse existing or create)
        let tenant = await db.query.tenants.findFirst({
            where: (t, { eq }) => eq(t.code, 'TEST001')
        });

        if (!tenant) {
            [tenant] = await db.insert(schema.tenants).values({
                name: '测试租户',
                code: 'TEST001'
            }).returning();
        }

        let user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.phone, '13800000000')
        });

        if (!user) {
            [user] = await db.insert(schema.users).values({
                tenantId: tenant.id,
                name: '测试管理员',
                phone: '13800000000',
                passwordHash: '123456'
            }).returning();
        }

        // 2. Create Mock Customers
        console.log('Creating Customers...');
        const customerData = [
            { name: '张三', phone: '13911112222', address: '北京市朝阳区阳光100' },
            { name: '李四', phone: '13933334444', address: '上海市浦东新区星河湾' },
            { name: '王五', phone: '13955556666', address: '广州市天河区珠江新城' },
        ];

        const customers: Array<typeof schema.customers.$inferSelect> = [];
        for (const c of customerData) {
            const [cust] = await db.insert(schema.customers).values({
                tenantId: tenant.id,
                name: c.name,
                phone: c.phone,
                customerNo: generateDocNo('C'),
                defaultAddress: c.address,
                createdBy: user.id
            }).onConflictDoNothing().returning();

            if (!cust) {
                const exist = await db.query.customers.findFirst({ where: (t, { eq }) => eq(t.phone, c.phone) });
                if (exist) customers.push(exist);
            } else {
                customers.push(cust);
            }
        }

        // 3. Create Mock Tickets
        console.log('Creating Tickets...');
        const ticketsData = [
            { type: 'REPAIR', status: 'PENDING', priority: 'URGENT', desc: '窗帘电动轨道卡住了，无法开合' },
            { type: 'COMPLAINT', status: 'PROCESSING', priority: 'NORMAL', desc: '安装师傅迟到了半小时，且态度不佳' },
            { type: 'REPLACE', status: 'CLOSED', priority: 'NORMAL', desc: '布料颜色发错了，申请换货' },
            { type: 'CONSULT', status: 'PENDING', priority: 'LOW', desc: '询问清洗服务价格' },
            { type: 'REPAIR', status: 'PENDING_VISIT', priority: 'URGENT', desc: '罗马杆掉下来了，很危险' },
        ] as const;

        for (const [index, t] of ticketsData.entries()) {
            const cust = customers[index % customers.length];
            await db.insert(schema.afterSalesTickets).values({
                tenantId: tenant.id,
                ticketNo: generateDocNo('AS') + index, // suffix to ensure unique if run fast
                customerId: cust.id,
                type: t.type,
                status: t.status,
                priority: t.priority,
                description: t.desc,
                createdBy: user.id,
                assignedTo: t.status === 'PROCESSING' ? user.id : null,
                createdAt: new Date(Date.now() - index * 86400000) // spread over days
            }).onConflictDoNothing();
        }

        console.log('✅ Mock data seeded successfully!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await client.end();
    }
}

seed();
