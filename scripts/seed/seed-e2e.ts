// 强制加载 .env.test 确保连接到测试数据库（l2c_test @ 127.0.0.1:5434）
// 不使用 dotenv/config（会加载 .env 即开发 DB），避免操作错误的数据库
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });
import { db } from '../../src/shared/api/db';
import {
    tenants,
    users,
    tenantMembers,
    customers,
    quotes,
    quoteItems,
    orders,
    installTasks,
    apLaborStatements,
} from '../../src/shared/api/schema';

import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const E2E_PHONE = '13800000001';
const E2E_PASSWORD = '123456';
const E2E_WORKER_PHONE = '13800000002'; // 安装师测试账号
const TENANT_CODE = 'E2E-TEST';

async function seed() {
    console.log('🌱 Starting E2E database seeding...');

    try {
        // 1. 获取或创建 E2E 专属租户
        console.log(`[1] Provisioning E2E tenant [${TENANT_CODE}]...`);
        let tenant = await db.query.tenants.findFirst({
            where: eq(tenants.code, TENANT_CODE),
        });

        if (!tenant) {
            const [newTenant] = await db
                .insert(tenants)
                .values({
                    name: 'E2E 自动化测试公司',
                    code: TENANT_CODE,
                    status: 'active',
                    planType: 'enterprise',
                    isGrandfathered: true,
                })
                .returning();
            tenant = newTenant;
            console.log(`    Created new tenant: ${tenant.id}`);
        } else {
            console.log(`    Found existing tenant: ${tenant.id}`);
        }

        // 2. 获取或创建 E2E 全局管理员账号
        console.log(`[2] Provisioning E2E super user [${E2E_PHONE}]...`);
        let user = await db.query.users.findFirst({
            where: eq(users.phone, E2E_PHONE),
        });

        if (!user) {
            const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
            const [newUser] = await db
                .insert(users)
                .values({
                    tenantId: tenant.id,
                    phone: E2E_PHONE,
                    name: 'E2E 管理员',
                    passwordHash,
                    role: 'ADMIN',
                    isActive: true,
                    // 注意：E2E 账号必须是普通租户管理员（非平台超管）
                    // 若设为 isPlatformAdmin: true，auth.ts 会将 tenantId 设为 '__PLATFORM__'（非法 UUID）
                    // 导致所有业务 DB 查询触发 PostgreSQL 22P02 错误
                    isPlatformAdmin: false,
                    lastActiveTenantId: tenant.id,
                })
                .returning();
            user = newUser;
            console.log(`    Created new user: ${user.id}`);
        } else {
            console.log(`    Found existing user: ${user.id}`);
            // 确保 E2E 账号密码正确，并强制设置为非平台超管
            const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
            await db
                .update(users)
                .set({ passwordHash, tenantId: tenant.id, role: 'ADMIN', isPlatformAdmin: false })
                .where(eq(users.id, user.id));
        }

        // 3. 关联或更新租户成员关系
        console.log(`[3] Binding membership with BOSS role...`);
        const membership = await db.query.tenantMembers.findFirst({
            where: (table, { and, eq }) =>
                and(eq(table.userId, user!.id), eq(table.tenantId, tenant!.id)),
        });

        if (!membership) {
            await db.insert(tenantMembers).values({
                userId: user.id,
                tenantId: tenant.id,
                role: 'BOSS',
                roles: ['BOSS', 'ADMIN'],
                isActive: true,
            });
            console.log(`    Created new membership for user: ${user.id}`);
        } else {
            await db
                .update(tenantMembers)
                .set({ role: 'BOSS', roles: ['BOSS', 'ADMIN'], isActive: true })
                .where(eq(tenantMembers.id, membership.id));
            console.log(`    Updated existing membership for user: ${user.id}`);
        }

        // ========== P0 新增：业务链路前置数据 ==========
        // 解决大量 E2E 用例因"无数据"被跳过的问题
        // 完整链路：E2E_CUSTOMER → 已锁定报价单（LOCKED）→ 已确认订单（CONFIRMED）→ 待分配安装单（PENDING_DISPATCH）

        // 4. 创建安装师（Worker）账号，用于安装分配流程测试
        console.log(`[4] Provisioning E2E worker account [${E2E_WORKER_PHONE}]...`);
        let worker = await db.query.users.findFirst({
            where: eq(users.phone, E2E_WORKER_PHONE),
        });
        if (!worker) {
            const workerHash = await bcrypt.hash(E2E_PASSWORD, 10);
            const [newWorker] = await db
                .insert(users)
                .values({
                    tenantId: tenant.id,
                    phone: E2E_WORKER_PHONE,
                    name: 'E2E 安装师',
                    passwordHash: workerHash,
                    role: 'WORKER',
                    isActive: true,
                    isPlatformAdmin: false,
                    lastActiveTenantId: tenant.id,
                })
                .returning();
            worker = newWorker;
            console.log(`    Created new worker: ${worker.id}`);
            await db.insert(tenantMembers).values({
                userId: worker.id,
                tenantId: tenant.id,
                role: 'WORKER',
                roles: ['WORKER'],
                isActive: true,
            });
        } else {
            console.log(`    Found existing worker: ${worker.id}`);
        }

        // 5. 创建 E2E 专属客户（幂等）
        console.log(`[5] Provisioning E2E base customer...`);
        const E2E_CUSTOMER_PHONE = '18800000001';
        let customer = await db.query.customers.findFirst({
            where: and(
                eq(customers.phone, E2E_CUSTOMER_PHONE),
                eq(customers.tenantId, tenant.id)
            ),
        });
        if (!customer) {
            const [newCustomer] = await db
                .insert(customers)
                .values({
                    tenantId: tenant.id,
                    customerNo: 'E2E-C-001', // 租户内唯一客户编号
                    name: 'E2E 基础客户',
                    phone: E2E_CUSTOMER_PHONE,
                    createdBy: user.id,
                })
                .returning();
            customer = newCustomer;
            console.log(`    Created new customer: ${customer.id}`);
        } else {
            console.log(`    Found existing customer: ${customer.id}`);
        }

        // 6. 创建已锁定报价单（确保报价单相关 E2E 有数据）
        console.log(`[6] Provisioning E2E locked quote...`);
        const E2E_QUOTE_NO = 'E2E-QT-001';
        let quote = await db.query.quotes.findFirst({
            where: and(
                eq(quotes.quoteNo, E2E_QUOTE_NO),
                eq(quotes.tenantId, tenant.id)
            ),
        });
        if (!quote) {
            const [newQuote] = await db
                .insert(quotes)
                .values({
                    tenantId: tenant.id,
                    quoteNo: E2E_QUOTE_NO,
                    customerId: customer.id,
                    title: 'E2E 自动化测试报价单',
                    totalAmount: '5000.00',
                    discountAmount: '0.00',
                    finalAmount: '5000.00',
                    status: 'LOCKED', // 已锁定，可直接用于生成订单
                    lockedAt: new Date(),
                    lockedBy: user.id,
                    isActive: true,
                    createdBy: user.id,
                })
                .returning();
            quote = newQuote;
            console.log(`    Created new quote: ${quote.id}`);

            // 创建报价单明细（安装流程自动生成安装项所需）
            await db.insert(quoteItems).values({
                tenantId: tenant.id,
                quoteId: quote.id,
                category: 'CURTAIN_FABRIC',
                productName: 'E2E 测试窗帘',
                roomName: '主卧',
                unitPrice: '500.00',
                quantity: '10.00',
                subtotal: '5000.00',
                createdBy: user.id,
            });
            console.log(`    Created quote items for quote: ${quote.id}`);
        } else {
            console.log(`    Found existing quote: ${quote.id}`);
        }

        // 7. 创建已确认订单（确保安装分配、劳务对账等 E2E 有数据）
        console.log(`[7] Provisioning E2E confirmed order...`);
        const E2E_ORDER_NO = 'E2E-ORD-001';
        let order = await db.query.orders.findFirst({
            where: and(
                eq(orders.orderNo, E2E_ORDER_NO),
                eq(orders.tenantId, tenant.id)
            ),
        });
        if (!order) {
            const [newOrder] = await db
                .insert(orders)
                .values({
                    tenantId: tenant.id,
                    orderNo: E2E_ORDER_NO,
                    quoteId: quote.id,
                    quoteVersionId: quote.id,
                    customerId: customer.id,
                    customerName: customer.name,
                    customerPhone: customer.phone ?? '',
                    totalAmount: '5000.00',
                    paidAmount: '5000.00',
                    balanceAmount: '0.00',
                    settlementType: 'CASH',
                    status: 'PENDING_INSTALL', // 待安装，可创建安装任务
                    salesId: user.id,
                    createdBy: user.id,
                })
                .returning();
            order = newOrder;
            console.log(`    Created new order: ${order.id}`);
        } else {
            console.log(`    Found existing order: ${order.id}`);
        }

        // 8. 创建待分配安装任务（确保安装调度 E2E 有数据）
        console.log(`[8] Provisioning E2E install task (PENDING_DISPATCH)...`);
        const E2E_TASK_NO = 'E2E-INS-001';
        let installTask = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.taskNo, E2E_TASK_NO),
                eq(installTasks.tenantId, tenant.id)
            ),
        });
        if (!installTask) {
            const [newTask] = await db
                .insert(installTasks)
                .values({
                    tenantId: tenant.id,
                    taskNo: E2E_TASK_NO,
                    orderId: order.id,
                    customerId: customer.id,
                    customerName: customer.name,
                    customerPhone: customer.phone ?? '',
                    sourceType: 'ORDER',
                    category: 'CURTAIN',
                    status: 'PENDING_DISPATCH', // 待分配，供安装调度测试
                    salesId: user.id,
                })
                .returning();
            installTask = newTask;
            console.log(`    Created new install task: ${installTask.id}`);
        } else {
            console.log(`    Found existing install task: ${installTask.id}`);
        }

        // 9. 创建劳务结算单（确保 /finance/ap 的"劳务结算" Tab 有可见数据）
        // TDD修复：测试 P0-3/P0-4/labor-settlement 需要此数据才能渲染 <table> 元素
        console.log(`[9] Provisioning E2E labor statement...`);
        const E2E_LABOR_STATEMENT_NO = 'E2E-LAB-001';
        const existingLaborStatement = await db.query.apLaborStatements.findFirst({
            where: and(
                eq(apLaborStatements.statementNo, E2E_LABOR_STATEMENT_NO),
                eq(apLaborStatements.tenantId, tenant.id)
            ),
        });
        if (!existingLaborStatement) {
            await db.insert(apLaborStatements).values({
                tenantId: tenant.id,
                statementNo: E2E_LABOR_STATEMENT_NO,
                workerId: worker.id,
                workerName: worker.name,
                settlementPeriod: '2026-03', // 格式: YYYY-MM
                totalAmount: '1500.00',
                paidAmount: '0.00',
                pendingAmount: '1500.00',
                status: 'CALCULATED', // 已试算，可被"付款"操作验证
                createdBy: user.id,
            });
            console.log(`    Created new labor statement: ${E2E_LABOR_STATEMENT_NO}`);
        } else {
            console.log(`    Found existing labor statement: ${existingLaborStatement.id}`);
        }
        // ========== 业务链路数据结束 ==========

        console.log('✅ E2E Seed completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ E2E Seeding failed:', error);
        process.exit(1);
    }
}

seed();
