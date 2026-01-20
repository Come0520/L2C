import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { ROLES } from './src/shared/config/roles';
import { eq } from 'drizzle-orm';
import { hashSync } from 'bcryptjs';

function generateDocNo(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

async function main() {
    try {
        console.log('🌱 Starting E2E Test Data Seeding...');

        // ===== 1. 创建或获取租户 =====
        const [tenant] = await db.insert(schema.tenants).values({
            name: 'E2E测试租户',
            code: 'E2E_TEST',
        }).onConflictDoUpdate({
            target: schema.tenants.code,
            set: { name: 'E2E测试租户' }
        }).returning();
        console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

        // ===== 2. 创建角色 =====
        const rolesData = [
            { name: '店长', code: 'MANAGER' },
            { name: '销售', code: 'SALES' },
            { name: '销售主管', code: 'SALES_MANAGER' },
            { name: '派单员', code: 'DISPATCHER' },
            { name: '财务', code: 'FINANCE' },
            { name: '安装师傅', code: 'INSTALLER' },
        ];

        for (const role of rolesData) {
            // Lookup permissions from ROLES config
            const preset = ROLES[role.code];
            const permissions = preset ? preset.permissions : [];

            // Manual Upsert: Check if role exists
            const existingRole = await db.query.roles.findFirst({
                where: (t, { and, eq }) => and(eq(t.tenantId, tenant.id), eq(t.code, role.code))
            });

            if (existingRole) {
                // Update permissions
                await db.update(schema.roles)
                    .set({ permissions: permissions })
                    .where(eq(schema.roles.id, existingRole.id));
            } else {
                // Insert new role
                await db.insert(schema.roles).values({
                    tenantId: tenant.id,
                    name: role.name,
                    code: role.code,
                    permissions: permissions, // Populate permissions
                    isSystem: true,
                });
            }
        }
        console.log(`✅ Roles: ${rolesData.length} roles created/verified`);

        // ===== 3. 创建用户 =====
        const usersData = [
            { name: '店长-测试', phone: '13800000001', role: 'MANAGER' },
            { name: '销售-张三', phone: '13800000002', role: 'SALES' },
            { name: '销售-李四', phone: '13800000003', role: 'SALES' },
            { name: '派单员-王五', phone: '13800000004', role: 'DISPATCHER' },
            { name: '财务-赵六', phone: '13800000005', role: 'FINANCE' },
            { name: '安装师傅-刘七', phone: '13800000006', role: 'INSTALLER' },
            { name: '测量师-陈八', phone: '13800000007', role: 'MEASURER' },
        ];

        const users: Record<string, typeof schema.users.$inferSelect> = {};
        for (const u of usersData) {
            const [user] = await db.insert(schema.users).values({
                tenantId: tenant.id,
                name: u.name,
                email: `${u.phone}@test.com`,
                phone: u.phone,
                passwordHash: hashSync('123456', 10),
                role: u.role,
            }).onConflictDoUpdate({
                target: schema.users.phone,
                set: { name: u.name, role: u.role, passwordHash: hashSync('123456', 10) }
            }).returning();
            users[u.role] = user;
        }
        console.log(`✅ Users: ${usersData.length} users created/verified`);

        // ===== 4. 创建供应商 =====
        const suppliersData = [
            { name: '窗帘厂家-测试', contact: '张经理', phone: '13900000001' },
            { name: '墙布厂家-测试', contact: '李经理', phone: '13900000002' },
            { name: '自有仓库', contact: '仓库管理员', phone: '13900000003' },
        ];

        const suppliers: Record<string, typeof schema.suppliers.$inferSelect> = {};
        for (const s of suppliersData) {
            const [supplier] = await db.insert(schema.suppliers).values({
                tenantId: tenant.id,
                name: s.name,
                contactName: s.contact,
                contactPhone: s.phone,
                supplierNo: generateDocNo('SUP'),
            }).onConflictDoNothing().returning();

            if (!supplier) {
                const existing = await db.query.suppliers.findFirst({
                    where: (t, { eq }) => eq(t.contactPhone, s.phone)
                });
                if (existing) suppliers[s.name] = existing;
            } else {
                suppliers[s.name] = supplier;
            }
        }
        console.log(`✅ Suppliers: ${Object.keys(suppliers).length} suppliers created/verified`);

        // ===== 5. 创建商品 =====
        const productsData = [
            { name: '遮光窗帘-A款', sku: 'CUR-001', category: 'CURTAIN_FABRIC' as const, unit: '米', basePrice: '45.00', supplier: '窗帘厂家-测试' },
            { name: '纱帘-B款', sku: 'CUR-002', category: 'CURTAIN_SHEER' as const, unit: '米', basePrice: '35.00', supplier: '窗帘厂家-测试' },
            { name: '电动轨道-标准', sku: 'TRA-001', category: 'CURTAIN_TRACK' as const, unit: '套', basePrice: '280.00', supplier: '自有仓库' },
            { name: '墙布-简约款', sku: 'WAL-001', category: 'WALLCLOTH' as const, unit: '平方米', basePrice: '120.00', supplier: '墙布厂家-测试' },
            { name: '抱枕套', sku: 'ACC-001', category: 'OTHER' as const, unit: '个', basePrice: '25.00', supplier: '自有仓库' },
        ];

        for (const p of productsData) {
            await db.insert(schema.products).values({
                tenantId: tenant.id,
                name: p.name,
                sku: p.sku,
                category: p.category,
                unit: p.unit,
                basePrice: p.basePrice,
                defaultSupplierId: suppliers[p.supplier]?.id,
            }).onConflictDoNothing();
        }
        console.log(`✅ Products: ${productsData.length} products created/verified`);

        // ===== 6. 创建报价方案 =====
        const plansData = [
            { code: 'ECONOMIC', name: '经济型' },
            { code: 'COMFORT', name: '舒适型' },
            { code: 'LUXURY', name: '豪华型' },
        ];

        for (const plan of plansData) {
            await db.insert(schema.quotePlans).values({
                tenantId: tenant.id,
                code: plan.code as typeof schema.quotePlanTypeEnum.enumValues[number],
                name: plan.name,
            }).onConflictDoNothing();
        }
        console.log(`✅ Quote Plans: ${plansData.length} plans created/verified`);

        // ===== 7. 创建测试客户 =====
        const customersData = [
            { name: 'E2E客户-张三', phone: '13811111111', address: '北京市朝阳区测试地址1' },
            { name: 'E2E客户-李四', phone: '13822222222', address: '上海市浦东新区测试地址2' },
            { name: 'E2E客户-王五', phone: '13833333333', address: '广州市天河区测试地址3' },
        ];

        const customers: Array<typeof schema.customers.$inferSelect> = [];
        for (const c of customersData) {
            const [customer] = await db.insert(schema.customers).values({
                tenantId: tenant.id,
                name: c.name,
                phone: c.phone,
                customerNo: generateDocNo('C'),
                // defaultAddress: c.address, // Removed as per schema
                createdBy: users['SALES'].id,
            }).onConflictDoNothing().returning();

            if (!customer) {
                const existing = await db.query.customers.findFirst({
                    where: (t, { eq }) => eq(t.phone, c.phone)
                });
                if (existing) customers.push(existing);
            } else {
                customers.push(customer);
            }
        }
        console.log(`✅ Customers: ${customers.length} customers created/verified`);

        // ===== 8. 创建系统字典 =====
        const dicts = [
            { category: 'LOGISTICS', key: 'SF', value: '顺丰速运', label: '顺丰速运' },
            { category: 'LOGISTICS', key: 'DB', value: '德邦物流', label: '德邦物流' },
            { category: 'LOGISTICS', key: 'YT', value: '圆通速递', label: '圆通速递' },
            { category: 'PAYMENT_METHOD', key: 'WECHAT', value: '微信支付', label: '微信支付' },
            { category: 'PAYMENT_METHOD', key: 'ALIPAY', value: '支付宝', label: '支付宝' },
            { category: 'PAYMENT_METHOD', key: 'BANK', value: '银行转账', label: '银行转账' },
            { category: 'PAYMENT_METHOD', key: 'CASH', value: '现金', label: '现金' },
        ];

        for (const d of dicts) {
            await db.insert(schema.sysDictionaries).values({
                tenantId: tenant.id,
                category: d.category,
                key: d.key,
                value: d.value,
                label: d.label,
            }).onConflictDoNothing();
        }
        console.log(`✅ Dictionaries: ${dicts.length} entries created/verified`);

        // ===== 9. 创建审批流程 =====
        const approvalFlowsData = [
            { code: 'GENERAL', name: '通用审批', description: '通用业务审批流程' },
            { code: 'QUOTE_DISCOUNT', name: '报价折扣审批', description: '报价折扣超出限额时的审批' },
        ];

        const defaultDefinition = {
            nodes: [
                { id: '1', type: 'start', position: { x: 250, y: 50 }, data: { label: '开始' } },
                { id: '2', type: 'end', position: { x: 250, y: 300 }, data: { label: '结束' } }
            ],
            edges: []
        };

        for (const flow of approvalFlowsData) {
            await db.insert(schema.approvalFlows).values({
                tenantId: tenant.id,
                code: flow.code,
                name: flow.name,
                description: flow.description,
                isActive: true,
                definition: defaultDefinition
            }).onConflictDoNothing();
        }
        console.log(`✅ Approval Flows: ${approvalFlowsData.length} flows created/verified`);

        console.log('');
        console.log('🎉 E2E Test Data Seeding Complete!');
        console.log('');
        console.log('📋 Test Account Summary:');
        console.log('  店长: 13800000001 / 123456');
        console.log('  销售: 13800000002 / 123456');
        console.log('  派单员: 13800000004 / 123456');
        console.log('  财务: 13800000005 / 123456');
        console.log('  安装师傅: 13800000006 / 123456');
        console.log('  测量师: 13800000007 / 123456');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

main();
