import 'dotenv/config';
import * as fs from 'fs';
import { db } from '@/shared/api/db';
import * as schema from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

const logFile = 'seed.log';
fs.writeFileSync(logFile, ''); // Clear log file

const originalLog = console.log;
const originalError = console.error;

function formatArgs(...args: any[]) {
    return args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
}

console.log = (...args) => {
    originalLog(...args);
    fs.appendFileSync(logFile, formatArgs(...args) + '\n');
};

console.error = (...args) => {
    originalError(...args);
    fs.appendFileSync(logFile, '[ERROR] ' + formatArgs(...args) + '\n');
};

// ==================== 工具函数 ====================

function generateDocNo(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
    const now = new Date();
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date;
}

const surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '林'];
const givenNames1 = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀'];
const givenNames2 = ['', '华', '英', '兰', '红', '波', '峰', '鹏', '梅', '霞', '龙', '燕', '平', '刚', '桂'];

function generateChineseName(): string {
    const surname = randomChoice(surnames);
    const given1 = randomChoice(givenNames1);
    const given2 = randomChoice(givenNames2);
    return surname + given1 + given2;
}

const cities = ['北京市朝阳区', '上海市浦东新区', '广州市天河区', '深圳市南山区', '杭州市西湖区', '成都市武侯区', '重庆市渝北区', '武汉市洪山区', '南京市鼓楼区', '西安市雁塔区'];
const communities = ['华润昆仑域', '万科城市花园', '保利中央公园', '绿地海珀云翡', '龙湖天街', '融创玖玺台', '中海寰宇天下', '恒大翡翠华庭', '碧桂园凤凰城', '招商雍景湾'];

function generateChineseAddress(): { city: string; community: string; full: string } {
    const city = randomChoice(cities);
    const community = randomChoice(communities);
    const building = randomInt(1, 15);
    const unit = randomInt(1, 6);
    const room = randomInt(101, 3202);
    const full = `${city}${community}${building}栋${unit}单元${room}`;
    return { city, community, full };
}

function generatePhone(): string {
    const prefixes = ['138', '139', '158', '159', '178', '188', '198'];
    const prefix = randomChoice(prefixes);
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + suffix;
}

// ==================== 主函数 ====================

async function main() {
    try {
        console.log('🌱 开始全业务流程数据播种...\n');

        // ===== 1. 基础设施层 =====
        console.log('📦 第一步:基础设施层数据');

        // 1.1 租户
        const [tenant] = await db.insert(schema.tenants).values({
            name: 'L2C示范租户',
            code: 'DEMO',
            logoUrl: '/logo.png',
            isActive: true,
        }).onConflictDoUpdate({
            target: schema.tenants.code,
            set: { name: 'L2C示范租户', updatedAt: new Date() }
        }).returning();
        console.log(`✅ 租户: ${tenant.name}`);

        // 1.2 角色
        const rolesData = [
            { name: '超级管理员', code: 'ADMIN', permissions: ['*'] },
            { name: '店长', code: 'MANAGER', permissions: ['lead.*', 'quote.*', 'order.*', 'finance.*', 'report.*'] },
            { name: '销售', code: 'SALES', permissions: ['lead.view', 'lead.create', 'lead.edit', 'quote.*', 'order.view'] },
            { name: '销售主管', code: 'SALES_MANAGER', permissions: ['lead.*', 'quote.*', 'order.*', 'customer.*'] },
            { name: '派单员', code: 'DISPATCHER', permissions: ['service.measure.*', 'service.install.*'] },
            { name: '财务', code: 'FINANCE', permissions: ['finance.*', 'order.view', 'quote.view'] },
            { name: '测量师', code: 'MEASURER', permissions: ['service.measurement.view', 'service.measurement.update'] },
            { name: '安装师傅', code: 'INSTALLER', permissions: ['service.install.view', 'service.install.update'] },
            { name: '采购员', code: 'PURCHASER', permissions: ['supply.*', 'supplier.*', 'inventory.*'] },
        ];

        for (const role of rolesData) {
            await db.insert(schema.roles).values({
                tenantId: tenant.id,
                ...role,
                isSystem: true,
            }).onConflictDoNothing();
        }
        console.log(`✅ 角色: ${rolesData.length} 个`);

        // 1.3 用户
        const usersData = [
            // 管理层
            { name: '张总', phone: '13800000001', role: 'MANAGER' },
            { name: '李经理', phone: '13800000002', role: 'SALES_MANAGER' },

            // 销售团队
            { name: '销售-王芳', phone: '13901001001', role: 'SALES' },
            { name: '销售-刘明', phone: '13901001002', role: 'SALES' },
            { name: '销售-陈静', phone: '13901001003', role: 'SALES' },
            { name: '销售-杨强', phone: '13901001004', role: 'SALES' },
            { name: '销售-赵丽', phone: '13901001005', role: 'SALES' },

            // 运营团队
            { name: '派单-周敏', phone: '13902002001', role: 'DISPATCHER' },
            { name: '派单-吴勇', phone: '13902002002', role: 'DISPATCHER' },
            { name: '财务-胡会计', phone: '13903003001', role: 'FINANCE' },
            { name: '财务-郭出纳', phone: '13903003002', role: 'FINANCE' },
            { name: '采购-何采购', phone: '13904004001', role: 'PURCHASER' },

            // 服务团队
            { name: '测量师-林师傅', phone: '13905005001', role: 'MEASURER' },
            { name: '测量师-马师傅', phone: '13905005002', role: 'MEASURER' },
            { name: '测量师-朱师傅', phone: '13905005003', role: 'MEASURER' },
            { name: '安装师-徐师傅', phone: '13906006001', role: 'INSTALLER', skills: ['CURTAIN', 'WALLCLOTH'], workerRating: '4.8' },
            { name: '安装师-孙师傅', phone: '13906006002', role: 'INSTALLER', skills: ['CURTAIN', 'ELECTRIC_TRACK'], workerRating: '4.9' },
            { name: '安装师-黄师傅', phone: '13906006003', role: 'INSTALLER', skills: ['CURTAIN', 'WALLCLOTH', 'WALLPANEL'], workerRating: '4.7' },
        ];

        const users: Record<string, typeof schema.users.$inferSelect> = {};
        for (const u of usersData) {
            const [user] = await db.insert(schema.users).values({
                tenantId: tenant.id,
                name: u.name,
                phone: u.phone,
                email: `${u.phone}@example.com`,
                // 密码: 123456 的 bcrypt 哈希
                passwordHash: '$2b$10$nIgNyH7hqSPi0IYtG.RFXeM0IfyQk8JQJSzMVV4eAX8rf.0M4sz.RK',
                role: u.role,
                isActive: true,
                skills: u.skills || [],
                workerRating: u.workerRating || null,
            }).onConflictDoUpdate({
                target: schema.users.phone,
                set: { name: u.name, role: u.role, updatedAt: new Date() }
            }).returning();

            // 按角色存储用户,方便后续引用
            if (!users[u.role]) {
                users[u.role] = user;
            }
            // 同时按 phone 存储每个用户
            users[u.phone] = user;
        }
        console.log(`✅ 用户: ${usersData.length} 个\n`);

        // 1.4 系统字典
        const dictionaries = [
            // 物流公司
            { category: 'LOGISTICS', key: 'SF', value: '顺丰速运', label: '顺丰速运' },
            { category: 'LOGISTICS', key: 'YT', value: '圆通速递', label: '圆通速递' },
            { category: 'LOGISTICS', key: 'ZTO', value: '中通快递', label: '中通快递' },
            { category: 'LOGISTICS', key: 'DB', value: '德邦物流', label: '德邦物流' },
            { category: 'LOGISTICS', key: 'ANE', value: '安能物流', label: '安能物流' },

            // 报价配置
            { category: 'QUOTE_CONFIG', key: 'FOLD_RATIO_FABRIC', value: '2.0', label: '布帘默认褶皱倍率' },
            { category: 'QUOTE_CONFIG', key: 'FOLD_RATIO_SHEER', value: '2.5', label: '纱帘默认褶皱倍率' },
            { category: 'QUOTE_CONFIG', key: 'LOSS_RATE', value: '0.05', label: '默认损耗率(5%)' },
        ];

        for (const d of dictionaries) {
            await db.insert(schema.sysDictionaries).values({
                tenantId: tenant.id,
                ...d,
                isActive: true,
            }).onConflictDoNothing();
        }
        console.log(`✅ 系统字典: ${dictionaries.length} 条\n`);

        // ===== 2. 资源层 =====
        console.log('📦 第二步:资源层数据');

        // 2.1 供应商
        const suppliersData = [
            { name: '杭州锦绣布艺厂', contact: '张经理', phone: '13700000101', type: 'CURTAIN_FABRIC' },
            { name: '绍兴纱帘源头厂', contact: '李厂长', phone: '13700000102', type: 'CURTAIN_SHEER' },
            { name: '佛山智能轨道科技', contact: '王总', phone: '13700000103', type: 'CURTAIN_TRACK' },
            { name: '上海德力电动窗帘', contact: '刘工', phone: '13700000104', type: 'MOTOR' },
            { name: '北京墙布贸易公司', contact: '陈经理', phone: '13700000105', type: 'WALLCLOTH' },
            { name: '广州护墙板厂家', contact: '杨总', phone: ' 13700000106', type: 'WALLPANEL' },
            { name: '成都飘窗垫定制', contact: '赵师傅', phone: '13700000107', type: 'WINDOWPAD' },
            { name: '深圳窗帘配件批发', contact: '周主管', phone: '13700000108', type: 'ACCESSORY' },
            { name: '自有仓库', contact: '仓库管理员', phone: '13700000999', type: 'STOCK' },
            { name: '武汉家居用品厂', contact: '吴总', phone: '13700000109', type: 'STANDARD' },
        ];

        const suppliers: Record<string, typeof schema.suppliers.$inferSelect> = {};
        for (const s of suppliersData) {
            const [supplier] = await db.insert(schema.suppliers).values({
                tenantId: tenant.id,
                supplierNo: generateDocNo('SUP'),
                name: s.name,
                contactName: s.contact,
                contactPhone: s.phone,
                paymentPeriod: randomChoice(['MONTHLY', 'SINGLE', 'PREPAY']),
                isActive: true,
            }).onConflictDoNothing().returning();

            if (supplier) {
                suppliers[s.type] = supplier;
            }
        }
        console.log(`✅ 供应商: ${Object.keys(suppliers).length} 个`);

        // 2.2 商品
        const productsData = [
            // 窗帘面料
            { name: '高档雪尼尔遮光窗帘-香槟金', sku: 'CUR-FAB-001', category: 'CURTAIN_FABRIC' as const, unit: '米', basePrice: '68.00', costPrice: '35.00', supplier: 'CURTAIN_FABRIC' },
            { name: '现代简约棉麻窗帘-米白色', sku: 'CUR-FAB-002', category: 'CURTAIN_FABRIC' as const, unit: '米', basePrice: '45.00', costPrice: '22.00', supplier: 'CURTAIN_FABRIC' },
            { name: '北欧风格雪花绒窗帘-深灰', sku: 'CUR-FAB-003', category: 'CURTAIN_FABRIC' as const, unit: '米', basePrice: '58.00', costPrice: '28.00', supplier: 'CURTAIN_FABRIC' },
            { name: '轻奢丝绒窗帘-宝石蓝', sku: 'CUR-FAB-004', category: 'CURTAIN_FABRIC' as const, unit: '米', basePrice: '88.00', costPrice: '45.00', supplier: 'CURTAIN_FABRIC' },
            { name: '儿童房卡通遮光帘', sku: 'CUR-FAB-005', category: 'CURTAIN_FABRIC' as const, unit: '米', basePrice: '52.00', costPrice: '25.00', supplier: 'CURTAIN_FABRIC' },

            // 纱帘
            { name: '白色蕾丝刺绣纱帘', sku: 'CUR-SHE-001', category: 'CURTAIN_SHEER' as const, unit: '米', basePrice: '35.00', costPrice: '15.00', supplier: 'CURTAIN_SHEER' },
            { name: '现代简约纯色纱帘-米色', sku: 'CUR-SHE-002', category: 'CURTAIN_SHEER' as const, unit: '米', basePrice: '28.00', costPrice: '12.00', supplier: 'CURTAIN_SHEER' },
            { name: '欧式镂空提花纱帘', sku: 'CUR-SHE-003', category: 'CURTAIN_SHEER' as const, unit: '米', basePrice: '42.00', costPrice: '18.00', supplier: 'CURTAIN_SHEER' },
            { name: '防紫外线银丝纱帘', sku: 'CUR-SHE-004', category: 'CURTAIN_SHEER' as const, unit: '米', basePrice: '38.00', costPrice: '16.00', supplier: 'CURTAIN_SHEER' },

            // 轨道
            { name: '静音铝合金轨道-单轨', sku: 'TRA-001', category: 'CURTAIN_TRACK' as const, unit: '米', basePrice: '45.00', costPrice: '20.00', supplier: 'CURTAIN_TRACK' },
            { name: '静音铝合金轨道-双轨', sku: 'TRA-002', category: 'CURTAIN_TRACK' as const, unit: '米', basePrice: '68.00', costPrice: '30.00', supplier: 'CURTAIN_TRACK' },
            { name: '罗马杆-经典款φ28mm', sku: 'TRA-003', category: 'CURTAIN_TRACK' as const, unit: '套', basePrice: '120.00', costPrice: '50.00', supplier: 'CURTAIN_TRACK' },
            { name: '电动窗帘轨道-标准版', sku: 'TRA-004', category: 'CURTAIN_TRACK' as const, unit: '套', basePrice: '380.00', costPrice: '180.00', supplier: 'CURTAIN_TRACK' },
            { name: '电动窗帘轨道-智能版', sku: 'TRA-005', category: 'CURTAIN_TRACK' as const, unit: '套', basePrice: '580.00', costPrice: '280.00', supplier: 'CURTAIN_TRACK' },

            // 配件
            { name: '窗帘挂钩-S钩', sku: 'ACC-001', category: 'CURTAIN_ACCESSORY' as const, unit: '个', basePrice: '0.50', costPrice: '0.20', supplier: 'ACCESSORY' },
            { name: '窗帘挂钩-四爪钩', sku: 'ACC-002', category: 'CURTAIN_ACCESSORY' as const, unit: '个', basePrice: '1.00', costPrice: '0.40', supplier: 'ACCESSORY' },
            { name: '窗帘绑带-流苏款', sku: 'ACC-003', category: 'CURTAIN_ACCESSORY' as const, unit: '对', basePrice: '12.00', costPrice: '5.00', supplier: 'ACCESSORY' },
            { name: '窗帘铅线-加重底边', sku: 'ACC-004', category: 'CURTAIN_ACCESSORY' as const, unit: '米', basePrice: '3.00', costPrice: '1.20', supplier: 'ACCESSORY' },

            // 墙布
            { name: '无缝墙布-现代简约', sku: 'WAL-001', category: 'WALLCLOTH' as const, unit: '平方米', basePrice: '120.00', costPrice: '55.00', supplier: 'WALLCLOTH' },
            { name: '无缝墙布-欧式奢华', sku: 'WAL-002', category: 'WALLCLOTH' as const, unit: '平方米', basePrice: '180.00', costPrice: '85.00', supplier: 'WALLCLOTH' },
            { name: '无缝墙布-中式古韵', sku: 'WAL-003', category: 'WALLCLOTH' as const, unit: '平方米', basePrice: '150.00', costPrice: '70.00', supplier: 'WALLCLOTH' },
            { name: '儿童房卡通墙布', sku: 'WAL-004', category: 'WALLCLOTH' as const, unit: '平方米', basePrice: '98.00', costPrice: '45.00', supplier: 'WALLCLOTH' },

            // 护墙板
            { name: '实木护墙板-胡桃木色', sku: 'PAN-001', category: 'WALLPANEL' as const, unit: '平方米', basePrice: '280.00', costPrice: '150.00', supplier: 'WALLPANEL' },
            { name: '竹木纤维护墙板-白橡', sku: 'PAN-002', category: 'WALLPANEL' as const, unit: '平方米', basePrice: '180.00', costPrice: '90.00', supplier: 'WALLPANEL' },
            { name: 'PVC仿大理石护墙板', sku: 'PAN-003', category: 'WALLPANEL' as const, unit: '平方米', basePrice: '120.00', costPrice: '60.00', supplier: 'WALLPANEL' },

            // 飘窗垫
            { name: '记忆棉飘窗垫-素色', sku: 'WIN-001', category: 'WINDOWPAD' as const, unit: '平方米', basePrice: '150.00', costPrice: '70.00', supplier: 'WINDOWPAD' },
            { name: '乳胶飘窗垫-高回弹', sku: 'WIN-002', category: 'WINDOWPAD' as const, unit: '平方米', basePrice: '220.00', costPrice: '110.00', supplier: 'WINDOWPAD' },
            { name: '四季通用飘窗垫', sku: 'WIN-003', category: 'WINDOWPAD' as const, unit: '平方米', basePrice: '180.00', costPrice: '85.00', supplier: 'WINDOWPAD' },

            // 标准商品
            { name: '抱枕套-北欧风', sku: 'STD-001', category: 'STANDARD' as const, unit: '个', basePrice: '28.00', costPrice: '12.00', supplier: 'STANDARD' },
            { name: '抱枕芯-45x45', sku: 'STD-002', category: 'STANDARD' as const, unit: '个', basePrice: '15.00', costPrice: '6.00', supplier: 'STANDARD' },
            { name: '地毯-客厅款1.6x2.3m', sku: 'STD-003', category: 'STANDARD' as const, unit: '块', basePrice: '380.00', costPrice: '180.00', supplier: 'STANDARD' },

            // 电机
            { name: 'WiFi智能窗帘电机-标准版', sku: 'MOT-001', category: 'MOTOR' as const, unit: '套', basePrice: '280.00', costPrice: '130.00', supplier: 'MOTOR' },
            { name: 'WiFi智能窗帘电机-静音版', sku: 'MOT-002', category: 'MOTOR' as const, unit: '套', basePrice: '380.00', costPrice: '180.00', supplier: 'MOTOR' },
        ];

        const productsList: typeof schema.products.$inferSelect[] = [];
        for (const p of productsData) {
            const [product] = await db.insert(schema.products).values({
                tenantId: tenant.id,
                sku: p.sku,
                name: p.name,
                category: p.category,
                unit: p.unit,
                unitPrice: p.basePrice,
                purchasePrice: p.costPrice,
                defaultSupplierId: suppliers[p.supplier]?.id,
                isStockable: ['CURTAIN_ACCESSORY', 'STANDARD', 'MOTOR'].includes(p.category),
                stockQuantity: ['CURTAIN_ACCESSORY', 'STANDARD', 'MOTOR'].includes(p.category) ? String(randomInt(100, 1000)) : '0',
                isActive: true,
            }).onConflictDoUpdate({
                target: schema.products.sku,
                set: {
                    name: p.name,
                    unitPrice: p.basePrice,
                    purchasePrice: p.costPrice,
                    updatedAt: new Date(),
                }
            }).returning();

            if (product) {
                productsList.push(product);
            } else {
                console.warn(`⚠️ Warning: Product insertion returned no data for ${p.sku}`);
            }
        }

        // 动态生成更多商品以达到 50+
        const extraProductCount = 30;
        const categories: any[] = ['CURTAIN_FABRIC', 'CURTAIN_SHEER', 'CURTAIN_TRACK', 'WALLCLOTH', 'WALLPANEL'];
        for (let i = 0; i < extraProductCount; i++) {
            const category = randomChoice(categories);
            const basePrice = String(randomInt(30, 200));
            const costPrice = String((Number(basePrice) * 0.5).toFixed(2));



            // Check existing
            const existing = await db.query.products.findFirst({
                where: (t, { eq, and }) => and(eq(t.sku, `GEN-${category}-${i + 1}`), eq(t.tenantId, tenant.id))
            });

            if (existing) {
                productsList.push(existing);
            } else {
                const [product] = await db.insert(schema.products).values({
                    tenantId: tenant.id,
                    sku: `GEN-${category}-${i + 1}`,
                    name: `标准${category === 'CURTAIN_FABRIC' ? '窗帘' : category === 'CURTAIN_SHEER' ? '纱帘' : '商品'}系列-${i + 1}`,
                    category: category,
                    unit: '米',
                    unitPrice: basePrice,
                    purchasePrice: costPrice,
                    defaultSupplierId: null,
                    isStockable: true,
                    stockQuantity: '0',
                    isActive: true,
                }).returning();
                if (product) productsList.push(product);
            }
        }
        console.log(`✅ 商品: ${productsList.length} 个 (含动态生成)`);

        /*
        // RELOAD ALL PRODUCTS TO ENSURE INTEGRITY
        console.log('🔄 Reloading all products from DB to ensure data integrity...');
        const allProducts = await db.query.products.findMany({
            where: (t, { eq }) => eq(t.tenantId, tenant.id)
        });
        console.log(`🔍 Debug: Found ${allProducts.length} products in DB for tenant ${tenant.id}`);
        if (allProducts.length > 0) {
            console.log(`🔍 Debug: First product sample:`, JSON.stringify(allProducts[0], null, 2));
        }

        productsList.length = 0;
        // Filter to only include products with valid unitPrice
        const validProducts = allProducts.filter(p => p.unitPrice !== null && p.unitPrice !== undefined);
        console.log(`🔍 Debug: Products after filtering for valid unitPrice: ${validProducts.length}`);

        productsList.push(...validProducts);
        productsList.push(...validProducts);
        console.log(`✅ 商品总数(DB): ${productsList.length} 个\n`);
        */

        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('DEBUG: STARTING QUOTE PLANS...');

        // 2.3 报价方案
        const quotePlansData = [
            { code: 'ECONOMIC' as const, name: '经济型方案', description: '性价比之选,满足基本需求' },
            { code: 'COMFORT' as const, name: '舒适型方案', description: '品质升级,居家首选' },
            { code: 'LUXURY' as const, name: '豪华型方案', description: '高端定制,尊享品质' },
        ];

        for (const plan of quotePlansData) {
            console.log(`DEBUG: Checking Quote Plan ${plan.code}`);
            const existing = await db.query.quotePlans.findFirst({
                where: (t, { eq, and }) => and(eq(t.code, plan.code), eq(t.tenantId, tenant.id))
            });

            if (!existing) {
                console.log(`DEBUG: Inserting Quote Plan ${plan.code}`);
                await db.insert(schema.quotePlans).values({
                    tenantId: tenant.id,
                    ...plan,
                    isActive: true,
                });
            }
        }
        console.log(`✅ 报价方案: ${quotePlansData.length} 个`);

        // 2.4 渠道配置
        const channelRootData = [
            { name: '线上渠道', code: 'ONLINE' },
            { name: '线下门店', code: 'OFFLINE' },
            { name: '异业带单', code: 'REFERRAL' },
        ];

        const channelRoots: Record<string, typeof schema.marketChannels.$inferSelect> = {};
        for (const cat of channelRootData) {
            console.log(`DEBUG: Processing Channel Root ${cat.code}`);
            // Check existing
            const existing = await db.query.marketChannels.findFirst({
                where: (t, { eq, and }) => and(eq(t.code, cat.code), eq(t.tenantId, tenant.id))
            });

            if (existing) {
                // Update
                const [updated] = await db.update(schema.marketChannels)
                    .set({ name: cat.name, updatedAt: new Date() })
                    .where(eq(schema.marketChannels.id, existing.id))
                    .returning();
                channelRoots[cat.code] = updated;
            } else {
                // Insert
                console.log(`DEBUG: Inserting Channel Root ${cat.code}`);
                const [root] = await db.insert(schema.marketChannels).values({
                    tenantId: tenant.id,
                    name: cat.name,
                    code: cat.code,
                    level: 1, // Root level
                    cooperationMode: 'REBATE',
                    commissionRate: '0',
                    isActive: true,
                }).returning();
                channelRoots[cat.code] = root;
            }
        }

        const channelsData = [
            { category: 'ONLINE', name: '美团', code: 'MEITUAN' },
            { category: 'ONLINE', name: '大众点评', code: 'DIANPING' },
            { category: 'ONLINE', name: '抖音', code: 'DOUYIN' },
            { category: 'ONLINE', name: '小红书', code: 'XIAOHONGSHU' },
            { category: 'OFFLINE', name: '自然进店', code: 'WALKIN' },
            { category: 'OFFLINE', name: '路边广告', code: 'OUTDOOR_AD' },
            { category: 'OFFLINE', name: '小区推广', code: 'COMMUNITY' },
            { category: 'REFERRAL', name: '老客户推荐', code: 'CUSTOMER_REFERRAL' },
            { category: 'REFERRAL', name: '装修公司', code: 'DECORATION' },
            { category: 'REFERRAL', name: '建材商', code: 'MATERIAL_SHOP' },
            { category: 'REFERRAL', name: '设计师', code: 'DESIGNER' },
        ];

        const channels: Record<string, typeof schema.marketChannels.$inferSelect> = {};
        for (const ch of channelsData) {
            console.log(`DEBUG: Processing Channel ${ch.code}`);
            const parent = channelRoots[ch.category];
            if (!parent) continue;

            // Check existing
            const existing = await db.query.marketChannels.findFirst({
                where: (t, { eq, and }) => and(eq(t.code, ch.code), eq(t.tenantId, tenant.id))
            });

            if (existing) {
                const [updated] = await db.update(schema.marketChannels)
                    .set({ name: ch.name, parentId: parent.id, updatedAt: new Date() })
                    .where(eq(schema.marketChannels.id, existing.id))
                    .returning();
                channels[ch.code] = updated;
            } else {
                console.log(`DEBUG: Inserting Channel ${ch.code}`);
                const [channel] = await db.insert(schema.marketChannels).values({
                    tenantId: tenant.id,
                    parentId: parent.id,
                    name: ch.name,
                    code: ch.code,
                    level: 2, // Child level
                    commissionRate: '0.10',
                    cooperationMode: 'REBATE',
                    isActive: true,
                }).returning();
                channels[ch.code] = channel;
            }
        }
        console.log(`✅ 渠道: ${Object.keys(channels).length} 个\n`);

        // 2.5 仓库与库存
        console.log('📦 第二.五步:仓库与库存数据');

        const warehousesData = ['主仓库', '东区仓库', '西区仓库', '样品库', '临时周转库'];
        const warehousesList: typeof schema.warehouses.$inferSelect[] = [];

        for (const name of warehousesData) {
            const [warehouse] = await db.insert(schema.warehouses).values({
                tenantId: tenant.id,
                name,
                address: '测试地址-' + name,
                managerId: users['13904004001'].id, // 采购员兼仓库管理
                isDefault: name === '主仓库',
            }).returning();
            warehousesList.push(warehouse);
        }
        console.log(`✅ 仓库: ${warehousesList.length} 个`);

        // 为所有商品在主仓库生成库存
        const mainWarehouse = warehousesList.find(w => w.name === '主仓库');
        if (mainWarehouse) {
            let inventoryCount = 0;
            for (const product of productsList) {
                if (product.isStockable) {
                    // console.log(`DEBUG: Inserting inventory for product ${product.id}`);
                    const quantity = randomInt(10, 500);
                    // 插入库存
                    try {
                        await db.insert(schema.inventory).values({
                            tenantId: tenant.id,
                            warehouseId: mainWarehouse.id,
                            productId: product.id,
                            quantity,
                            minStock: 10,
                            location: `A-${randomInt(1, 10)}-${randomInt(1, 20)}`,
                        });

                        // 插入库存流水 (初始化)
                        await db.insert(schema.inventoryLogs).values({
                            tenantId: tenant.id,
                            warehouseId: mainWarehouse.id,
                            productId: product.id,
                            type: 'IN', // 使用入库类型
                            quantity,
                            balanceAfter: quantity,
                            reason: '期初库存初始化',
                            operatorId: users['13904004001']?.id || users['13904001001']?.id, // Fallback if user missing
                            createdAt: randomDate(60),
                        });
                    } catch (e) {
                        console.error(`❌ Failed inventory insert for product ${product.id}`, e);
                        throw e;
                    }
                    inventoryCount++;
                }
            }
            console.log(`✅ 库存记录: ${inventoryCount} 条`);
        }

        // 2.6 面料库存 (Fabric Inventory) - 针对窗帘面料的细分库存 (Rolls)
        const fabricProducts = productsList.filter(p => p.category === 'CURTAIN_FABRIC');
        let fabricRollCount = 0;
        if (mainWarehouse && fabricProducts.length > 0) {
            for (const product of fabricProducts) {
                // 每种面料生成 3-5 卷
                const rollCount = randomInt(3, 5);
                for (let i = 0; i < rollCount; i++) {
                    const length = randomInt(20, 60);
                    const [roll] = await db.insert(schema.fabricInventory).values({
                        tenantId: tenant.id,
                        fabricProductId: product.id,
                        fabricSku: product.sku,
                        fabricName: product.name,
                        batchNo: `BATCH-${randomDate(100).toISOString().slice(0, 10).replace(/-/g, '')}`,
                        availableQuantity: String(length),
                        totalQuantity: String(length),
                        warehouseLocation: `${mainWarehouse.name} F-${randomInt(1, 10)}`,
                    }).returning();

                    // Log
                    await db.insert(schema.fabricInventoryLogs).values({
                        tenantId: tenant.id,
                        fabricInventoryId: roll.id,
                        logType: 'PURCHASE_IN',
                        quantity: String(length),
                        beforeQuantity: '0',
                        afterQuantity: String(length),
                        reason: '采购入库',
                        operatorId: users['13904004001'].id,
                        createdAt: randomDate(60),
                    });
                    fabricRollCount++;
                }
            }
        }
        console.log(`✅ 面料库存: ${fabricRollCount} 卷\n`);

        // ===== 3. 客户层 =====
        console.log('📦 第三步:客户层数据');

        const customersData: { name: string; phone: string; address: ReturnType<typeof generateChineseAddress>; level: 'A' | 'B' | 'C' | 'D'; salesId: string }[] = [];
        const salesUserPhones = ['13901001001', '13901001002', '13901001003', '13901001004', '13901001005'];

        for (let i = 0; i < 300; i++) {
            const name = generateChineseName();
            const phone = generatePhone();
            const address = generateChineseAddress();
            const level = randomChoice(['A', 'B', 'B', 'C', 'C', 'C', 'D', 'D'] as const);
            const salesId = randomChoice(salesUserPhones);

            customersData.push({ name, phone, address, level, salesId });
        }

        const customersList: typeof schema.customers.$inferSelect[] = [];
        for (const c of customersData) {
            const [customer] = await db.insert(schema.customers).values({
                tenantId: tenant.id,
                customerNo: generateDocNo('C'),
                name: c.name,
                phone: c.phone,
                defaultAddress: c.address.full,
                addresses: [c.address],
                level: c.level,
                assignedSalesId: users[c.salesId]?.id,
                createdBy: users[c.salesId]?.id,
                createdAt: randomDate(randomInt(30, 90)),
            }).onConflictDoNothing().returning();
            if (customer) {
                customersList.push(customer);
            }
        }

        console.error(`DEBUG: Customers FINISHED. Count: ${customersList.length}`);

        await new Promise(resolve => setTimeout(resolve, 500));

        // ===== 4. 销售线索层 =====
        console.error('DEBUG: STEP 4 STARTING...');
        console.log('📦 第四步:销售线索与跟进');

        // 4.1 线索
        // 4.1 线索 (动态生成 1000 条)
        // 定义线索状态模板
        const leadTemplates: any[] = [
            // 待派单 (20%)
            { status: 'PENDING_ASSIGNMENT', intentionLevel: 'MEDIUM', channel: 'MEITUAN' },
            { status: 'PENDING_ASSIGNMENT', intentionLevel: 'HIGH', channel: 'DOUYIN' },
            // 跟进中 (50%)
            { status: 'FOLLOWING_UP', intentionLevel: 'HIGH', channel: 'DIANPING' },
            { status: 'FOLLOWING_UP', intentionLevel: 'MEDIUM', channel: 'COMMUNITY' },
            { status: 'FOLLOWING_UP', intentionLevel: 'HIGH', channel: 'CUSTOMER_REFERRAL' },
            { status: 'FOLLOWING_UP', intentionLevel: 'LOW', channel: 'WALKIN' },
            // 已成交 (20%)
            { status: 'WON', intentionLevel: 'HIGH', channel: 'MEITUAN' },
            { status: 'WON', intentionLevel: 'HIGH', channel: 'CUSTOMER_REFERRAL' },
            { status: 'WON', intentionLevel: 'MEDIUM', channel: 'WALKIN' },
            // 作废 (10%)
            { status: 'VOID', intentionLevel: 'LOW', channel: 'OUTDOOR_AD' },
            { status: 'VOID', intentionLevel: 'LOW', channel: 'XIAOHONGSHU' },
        ] as const;

        const leadsList: typeof schema.leads.$inferSelect[] = [];
        console.log(`🔍 Debug: Starting lead generation loop...`);

        // Debug: Try only 1 iteration first
        for (let i = 0; i < 1; i++) {
            const template = randomChoice(leadTemplates);
            // console.log(`🔍 Debug: Processing lead ${i + 1}, template:`, JSON.stringify(template));
            const customer = customersList[i % customersList.length]; // 循环使用客户
            const channel = channels[template.channel];
            if (!channel && i === 0) console.warn(`⚠️ Warning: Channel not found for code ${template.channel}`);

            // 随机生成时间，最近 180 天分布
            const daysAgo = randomInt(0, 180);
            const createdAt = randomDate(daysAgo);

            // 分配销售
            let salesUser = null;
            if (template.status !== 'PENDING_ASSIGNMENT') {
                const salesPhone = randomChoice(salesUserPhones);
                salesUser = users[salesPhone];
            }

            let lead;
            try {
                console.log(`DEBUG: Inserting lead status=${template.status} intention=${template.intentionLevel} channel=${template.channel}`);
                [lead] = await db.insert(schema.leads).values({
                    tenantId: tenant.id,
                    leadNo: generateDocNo('L'),
                    sourceChannelId: channel?.parentId,
                    sourceSubId: channel?.id,
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    community: (customer.addresses as Array<{ community?: string }>)?.[0]?.community || '未知小区',
                    address: customer.defaultAddress,
                    intentionLevel: template.intentionLevel,
                    estimatedAmount: String(randomInt(5000, 50000)),
                    status: template.status,
                    assignedSalesId: salesUser?.id,
                    assignedAt: salesUser ? createdAt : null,
                    customerId: template.status === 'WON' ? customer.id : null,
                    createdBy: salesUser?.id || users['13800000001'].id,
                    createdAt,
                    lastActivityAt: randomDate(Math.max(0, daysAgo - randomInt(0, 5))),
                    wonAt: template.status === 'WON' ? randomDate(Math.max(0, daysAgo - 5)) : null,
                    lostReason: template.status === 'VOID' ? randomChoice(['价格太高', '已选其他商家', '暂不需要', '联系不上']) : null,
                }).returning();
            } catch (e: any) {
                console.error(`❌ Failed to insert lead. Data:`, JSON.stringify({
                    leadNo: generateDocNo('L'), // Note: this will be a new one, but illustrative
                    customerName: customer.name,
                    status: template.status,
                    intentionLevel: template.intentionLevel,
                    channel: template.channel,
                    sourceChannelId: channel?.parentId,
                    sourceSubId: channel?.id,
                    address: customer.defaultAddress
                }, null, 2));
                console.error(`Error details:`, e);
                throw e; // Stop execution to fix it
            }

            if (lead) {
                leadsList.push(lead);

                // 为跟进中和已成交的线索添加跟进记录
                if (template.status === 'FOLLOWING_UP' || template.status === 'WON') {
                    const followupCount = randomInt(1, 5);
                    for (let j = 0; j < followupCount; j++) {
                        try {
                            const typeMap: Record<string, 'PHONE_CALL' | 'WECHAT_CHAT' | 'STORE_VISIT'> = {
                                'CALL': 'PHONE_CALL',
                                'WECHAT': 'WECHAT_CHAT',
                                'VISIT': 'STORE_VISIT'
                            };
                            const typeKey = randomChoice(['CALL', 'WECHAT', 'VISIT']);

                            await db.insert(schema.leadActivities).values({
                                tenantId: tenant.id,
                                leadId: lead.id,
                                activityType: typeMap[typeKey],
                                content: randomChoice([
                                    '电话沟通,客户有意向,预约周末上门量房',
                                    '微信发送产品图册,客户表示需要考虑',
                                    '客户到店看样,对雪尼尔系列比较感兴趣',
                                    '上门量房,测量尺寸并初步报价',
                                    '沟通预算方案，客户比较关注性价比',
                                    '确认安装时间，客户希望尽快安装',
                                ]),
                                createdBy: salesUser ? salesUser.id : users['13800000001'].id,
                                createdAt: randomDate(daysAgo - j * 3),
                            });
                        } catch (e) {
                            console.error(`❌ Failed to insert lead ACTIVITY`, e);
                        }
                    }
                }
            }
        }

        console.log(`✅ 线索: ${leadsList.length} 条`);

        console.log('\n🎉 数据播种第一阶段完成!');
        console.log('已生成:用户、供应商、商品、渠道、客户、线索数据\n');
        console.log('提示:接下来将生成报价单、订单等数据,请稍候...\n');

        // ===== 5. 报价单层 =====
        console.log('📦 第五步:报价单数据');

        // 为已成交的线索生成报价单
        const wonLeads = leadsList.filter(l => l.status === 'WON');
        // 为跟进中的线索也生成一些报价单
        const followingLeadsWithQuote = leadsList.filter(l => l.status === 'FOLLOWING_UP').slice(0, 3);
        const leadsForQuotes = [...wonLeads, ...followingLeadsWithQuote];

        const quotesList: Array<typeof schema.quotes.$inferSelect> = [];
        const roomsList: Array<typeof schema.rooms.$inferSelect> = [];

        for (const lead of leadsForQuotes) {
            const customer = customersList.find(c => c.id === lead.customerId) || customersList[0];
            // 使用 phone 查找用户，因为 users 对象是按 phone 存储的
            const salesUserPhone = lead.assignedSalesId ?
                Object.values(users).find(u => u.id === lead.assignedSalesId)?.phone || '13901001001' :
                '13901001001';
            const salesUser = users[salesUserPhone];

            const isActive = lead.status === 'WON';
            const createdAt = lead.wonAt || randomDate(20);

            // 创建报价单
            let quote;
            try {
                console.log(`Inserting quote for lead ${lead.id}...`);
                [quote] = await db.insert(schema.quotes).values({
                    tenantId: tenant.id,
                    quoteNo: generateDocNo('Q'),
                    version: 1,
                    isLatest: true,
                    leadId: lead.id,
                    customerId: customer.id,
                    status: 'DRAFT', // Explicitly DRAFT
                    totalAmount: '0',
                    discountAmount: '0',
                    finalAmount: '0',
                    installationFee: '300',
                    measurementFee: '0',
                    freightFee: '150',
                    createdBy: salesUser.id,
                    createdAt,
                    lockedAt: isActive ? createdAt : null,
                }).returning();
                console.log(`✅ Inserted quote ${quote.id}`);
            } catch (e: any) {
                console.error(`❌ Failed to insert quote for lead ${lead.id}. Data:`, JSON.stringify({
                    leadId: lead.id,
                    customerId: customer.id,
                    status: isActive ? 'ACCEPTED' : 'DRAFT',
                    salesUserId: salesUser?.id
                }, null, 2));
                console.error(e);
                // throw e; // Allow continue to debug other items
            }

            quotesList.push(quote);

            if (!quote) continue; // Skip if quote creation failed

            // 创建空间(1-3个空间)
            const roomCount = randomChoice([1, 2, 2, 3]);
            const roomNames = ['客厅', '主卧', '次卧', '书房', '儿童房'];
            const quoteRooms: typeof schema.rooms.$inferSelect[] = [];

            for (let i = 0; i < roomCount; i++) {
                const [room] = await db.insert(schema.quoteRooms).values({
                    tenantId: tenant.id,
                    quoteId: quote.id,
                    name: roomNames[i],
                    sortOrder: i,
                }).returning();

                quoteRooms.push(room);
                roomsList.push(room);
            }

            // 为每个空间添加商品明细
            let quoteTotalAmount = 0;

            for (const room of quoteRooms) {
                // 每个空间1-3个商品
                const itemCount = randomChoice([2, 3, 3]);

                for (let i = 0; i < itemCount; i++) {
                    let product;
                    let width, height, quantity, foldRatio, unitPrice, subtotal;

                    // 第一个商品:窗帘面料
                    if (i === 0) {
                        product = productsList.find(p => p.category === 'CURTAIN_FABRIC') || productsList[0];
                        width = randomChoice(['2.8', '3.2', '3.5', '4.0']);
                        height = randomChoice(['2.6', '2.7', '2.8']);
                        foldRatio = '2.0';
                        quantity = String(Number(width) * Number(foldRatio));
                        unitPrice = product.unitPrice;
                        subtotal = String(Number(quantity) * Number(unitPrice) * Number(height));
                    }
                    // 第二个商品:纱帘
                    else if (i === 1) {
                        product = productsList.find(p => p.category === 'CURTAIN_SHEER') || productsList[1];
                        width = randomChoice(['2.8', '3.2', '3.5', '4.0']);
                        height = randomChoice(['2.6', '2.7', '2.8']);
                        foldRatio = '2.5';
                        quantity = String(Number(width) * Number(foldRatio));
                        unitPrice = product.unitPrice;
                        subtotal = String(Number(quantity) * Number(unitPrice) * Number(height));
                    }
                    // 第三个商品:轨道
                    else {
                        product = productsList.find(p => p.category === 'CURTAIN_TRACK') || productsList[2];
                        width = randomChoice(['2.8', '3.2', '3.5', '4.0']);
                        height = null;
                        foldRatio = null;
                        quantity = '1';
                        unitPrice = product.unitPrice;
                        subtotal = String(Number(width) * Number(unitPrice));
                    }

                    if (!unitPrice) {
                        console.error(`❌ Error: Unit Price is missing for product ${product.name} (${product.id}). UnitPrice: ${product.unitPrice}, Category: ${product.category}`);
                        unitPrice = '0.00'; // Fallback to avoid crash, but log it
                    }

                    await db.insert(schema.quoteItems).values({
                        tenantId: tenant.id,
                        quoteId: quote.id,
                        roomId: room.id,
                        productId: product.id,
                        productName: product.name,
                        sku: product.sku,
                        category: product.category,
                        width,
                        height,
                        quantity,
                        unit: product.unit,
                        foldRatio,
                        unitPrice,
                        subtotal,
                        sortOrder: i,
                    });
                    console.log(`  ✅ Inserted item ${i} for room ${room.name}`);

                    quoteTotalAmount += Number(subtotal);
                }
            }

            // 更新报价单总额
            const finalAmount = quoteTotalAmount + 300 + 150; // 加上安装费和运费
            await db.update(schema.quotes)
                .set({
                    totalAmount: String(quoteTotalAmount.toFixed(2)),
                    finalAmount: String(finalAmount.toFixed(2)),
                })
                .where(eq(schema.quotes.id, quote.id));
        }

        console.log(`✅ 报价单: ${quotesList.length} 个`);
        console.log(`✅ 空间: ${roomsList.length} 个\n`);

        // ===== 6. 订单层 =====
        console.log('📦 第六步:订单数据');

        // 为已成交线索创建订单(取前10个报价单)
        const quotesForOrders = quotesList.filter(q => q.status === 'LOCKED').slice(0, 10);
        const ordersList: Array<typeof schema.orders.$inferSelect> = [];

        const orderStatuses = ['PENDING_PO', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALL', 'COMPLETED'];

        for (const [index, quote] of quotesForOrders.entries()) {
            const lead = leadsList.find(l => l.id === quote.leadId);
            const customer = customersList.find(c => c.id === quote.customerId) || customersList[0];
            const salesUserPhone = lead?.assignedSalesId ?
                Object.values(users).find(u => u.id === lead.assignedSalesId)?.phone || '13901001001' :
                '13901001001';
            const salesUser = users[salesUserPhone];

            const status = orderStatuses[index % orderStatuses.length] as typeof schema.orderStatusEnum.enumValues[number];
            const createdAt = quote.lockedAt || randomDate(15);

            const orderValues: Record<string, unknown> = {
                tenantId: tenant.id,
                orderNo: generateDocNo('ORD'),
                quoteId: quote.id,
                quoteVersionId: quote.id,
                customerId: customer.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                deliveryAddress: customer.defaultAddress || '待补充地址',
                status,
                totalAmount: quote.finalAmount,
                paidAmount: status === 'COMPLETED' ? quote.finalAmount : String(Number(quote.finalAmount) * 0.5),
                salesId: salesUser.id,
                createdBy: salesUser.id,
                createdAt,
            };

            // 只有当 lead 存在时才添加 leadId
            if (lead?.id) {
                orderValues.leadId = lead.id;
            }

            // 只有当订单完成时才添加 completedAt
            if (status === 'COMPLETED') {
                orderValues.completedAt = randomDate(2);
            }

            let order;
            try {
                [order] = await db.insert(schema.orders).values(orderValues as typeof schema.orders.$inferInsert).returning();
            } catch (e) {
                console.error(`❌ Failed to insert order for quote ${quote.id}`);
                console.error(e);
                continue;
            }

            ordersList.push(order);

            // Create Order Items from Quote Items
            const quoteItems = await db.query.quoteItems.findMany({
                where: (t, { eq }) => eq(t.quoteId, quote.id)
            });

            for (const qi of quoteItems) {
                const roomName = (await db.query.quoteRooms.findFirst({
                    where: (t, { eq }) => eq(t.id, qi.roomId!)
                }))?.name || '未知空间';

                await db.insert(schema.orderItems).values({
                    tenantId: tenant.id,
                    orderId: order.id,
                    quoteItemId: qi.id,
                    roomName,
                    productId: qi.productId,
                    productName: qi.productName,
                    category: qi.category,
                    quantity: qi.quantity,
                    width: qi.width,
                    height: qi.height,
                    unitPrice: qi.unitPrice,
                    subtotal: qi.subtotal,
                    status: 'PENDING',
                    sortOrder: qi.sortOrder,
                });
            }
        }

        console.log(`✅ 订单: ${ordersList.length} 个\n`);

        // 6.2 订单变更记录 (Order Changes)
        let changeCount = 0;
        for (const order of ordersList) {
            if (order.status !== 'PENDING_PAYMENT' && Math.random() > 0.7) {
                // 模拟一次变更
                // 模拟一次变更
                const type = randomChoice(['FIELD_CHANGE', 'CUSTOMER_CHANGE', 'STOCK_OUT', 'OTHER']);
                try {
                    await db.insert(schema.orderChanges).values({
                        tenantId: tenant.id,
                        orderId: order.id,
                        type: type as any,
                        reason: '正常流转或变更',
                        status: 'PENDING', // Default
                        originalData: type === 'FIELD_CHANGE' ? { note: 'Old measurements' } : {},
                        newData: type === 'FIELD_CHANGE' ? { note: 'New measurements' } : {},
                        requestedBy: users['13901001001'].id,
                        createdAt: randomDate(5),
                    });
                    changeCount++;
                } catch (e) { console.error(`Failed order change`, e); }
            }
        }
        console.log(`✅ 订单变更: ${changeCount} 条\n`);

        // ===== 7. 服务交付层 =====
        console.log('📦 第七步:服务交付数据');

        // 7.1 测量任务(为部分线索创建)
        const leadsForMeasure = leadsList.filter(l => l.status === 'FOLLOWING_UP' || l.status === 'WON').slice(0, 10);
        const measureTasksList: Array<typeof schema.measureTasks.$inferSelect> = [];

        for (const lead of leadsForMeasure) {
            const customer = customersList.find(c => c.id === lead.customerId) || customersList[0];
            // 通过 assignedSalesId 查找用户的 phone，然后使用 phone 查找 users 对象
            const salesUserPhone = lead.assignedSalesId ?
                Object.values(users).find(u => u.id === lead.assignedSalesId)?.phone || '13901001001' :
                '13901001001';
            const salesUser = users[salesUserPhone];
            const dispatcher = users['13902002001']; // 派单员
            const measurer = randomChoice([users['13905005001'], users['13905005002'], users['13905005003']]);

            const status = randomChoice(['COMPLETED', 'PENDING_VISIT', 'PENDING_CONFIRM']) as typeof schema.measureTaskStatus.enumValues[number];
            const createdAt = randomDate(randomInt(10, 30));

            let measureTask;
            try {
                [measureTask] = await db.insert(schema.measureTasks).values({
                    tenantId: tenant.id,
                    measureNo: generateDocNo('M'),
                    leadId: lead.id,
                    customerId: customer.id,
                    status,
                    dispatcherId: dispatcher.id,
                    salesId: salesUser.id,
                    scheduledAt: randomDate(randomInt(5, 15)),
                    assignedWorkerId: measurer.id,
                    round: 1,
                    variant: 'A',
                    versionDisplay: 'V1.A',
                    isActive: true,
                    resultData: status === 'COMPLETED' ? {
                        rooms: [{ name: '客厅', width: '3.5', height: '2.8' }]
                    } : null,
                    createdBy: dispatcher.id,
                    createdAt,
                    completedAt: status === 'COMPLETED' ? randomDate(randomInt(1, 5)) : null,
                }).returning();

                measureTasksList.push(measureTask);
            } catch (e) {
                console.error(`Failed measure task`, e);
            }
        }

        console.log(`✅ 测量任务: ${measureTasksList.length} 个`);

        // 7.2 安装任务(为已发货/待安装/已完成的订单创建)
        const ordersForInstall = ordersList.filter(o =>
            ['SHIPPED', 'PENDING_INSTALL', 'COMPLETED'].includes(o.status as string)
        );
        const installTasksList: (typeof schema.installTasks.$inferSelect)[] = [];

        for (const order of ordersForInstall) {
            const customer = customersList.find(c => c.id === order.customerId) || customersList[0];
            const salesUserPhone = order.salesId ?
                Object.values(users).find(u => u.id === order.salesId)?.phone || '13901001001' :
                '13901001001';
            const salesUser = users[salesUserPhone];
            const dispatcher = users['13902002002'];
            const installer = randomChoice([users['13906006001'], users['13906006002'], users['13906006003']]);

            const status = order.status === 'COMPLETED' ? 'COMPLETED' as const :
                order.status === 'PENDING_INSTALL' ? 'PENDING_VISIT' as const :
                    'DISPATCHING' as const;

            const [installTask] = await db.insert(schema.installTasks).values({
                tenantId: tenant.id,
                taskNo: generateDocNo('I'),
                orderId: order.id,
                customerId: customer.id,
                category: 'CURTAIN_FABRIC' as const,
                status,
                salesId: salesUser.id,
                dispatcherId: dispatcher.id,
                scheduledAt: randomDate(randomInt(3, 10)),
                assignedWorkerId: installer.id,
                laborFee: String(randomInt(200, 500)),
                actualLaborFee: status === 'COMPLETED' ? String(randomInt(200, 500)) : null,
                rating: status === 'COMPLETED' ? randomInt(4, 5) : null,
                ratingComment: status === 'COMPLETED' ? randomChoice(['师傅很专业,安装很仔细', '效果很好,非常满意', '服务态度好']) : null,
                createdBy: salesUser.id,
                createdAt: order.createdAt,
                completedAt: status === 'COMPLETED' ? randomDate(randomInt(1, 5)) : null,
            }).returning();

            installTasksList.push(installTask);

            // 为已完成安装添加照片
            if (status === 'COMPLETED') {
                for (let i = 0; i < 3; i++) {
                    await db.insert(schema.installPhotos).values({
                        tenantId: tenant.id,
                        installTaskId: installTask.id,
                        type: i === 0 ? 'BEFORE' as const : 'AFTER' as const,
                        url: `/uploads/install-${installTask.id}-${i}.jpg`,
                        roomName: i < 2 ? '客厅' : '主卧',
                        uploadedBy: installer.id,
                    });
                }
            }
        }

        console.log(`✅ 安装任务: ${installTasksList.length} 个\n`);

        // 7.3 售后工单与维保
        console.log('📦 第七.三步:售后与维保数据');

        const afterSalesOrders = ordersList.filter(o => o.status === 'COMPLETED').slice(0, 50);
        const afterSalesList: typeof schema.afterSalesTickets.$inferSelect[] = [];

        for (const order of afterSalesOrders) {
            const customer = customersList.find(c => c.id === order.customerId);
            if (!customer) continue;

            const installTask = installTasksList.find(it => it.orderId === order.id);

            const [ticket] = await db.insert(schema.afterSalesTickets).values({
                tenantId: tenant.id,
                ticketNo: generateDocNo('AST'),
                orderId: order.id,
                customerId: customer.id,
                installTaskId: installTask?.id,
                type: randomChoice(['QUALITY', 'INSTALLATION', 'LOGISTICS']),
                status: randomChoice(['PENDING', 'PROCESSING', 'COMPLETED']),
                description: '客户反馈部分窗帘褶皱不均匀，希望能调整',
                priority: 'MEDIUM',
                isWarranty: true,
                createdBy: users['13901001001'].id,
                createdAt: randomDate(5),
            }).returning();

            if (ticket) afterSalesList.push(ticket);
        }
        console.log(`✅ 售后工单: ${afterSalesList.length} 个\n`);

        // ===== 8. 供应链层 =====
        console.log('📦 第八步:供应链数据');

        // 为订单创建采购单 (处理前 100 个订单)
        const ordersForPO = ordersList.slice(0, 100);

        for (const order of ordersForPO) {
            const quote = quotesList.find(q => q.id === order.quoteId);
            if (!quote) continue;

            const quoteItems = await db.query.quoteItems.findMany({
                where: (qi, { eq }) => eq(qi.quoteId, quote.id),
            });

            // 按供应商分组采购
            const supplierGroups = new Map<string, typeof quoteItems>();
            for (const item of quoteItems) {
                const product = productsList.find(p => p.id === item.productId);
                if (!product?.defaultSupplierId) continue;

                if (!supplierGroups.has(product.defaultSupplierId)) {
                    supplierGroups.set(product.defaultSupplierId, []);
                }
                supplierGroups.get(product.defaultSupplierId)!.push(item);
            }

            // 为每个供应商创建采购单
            for (const [supplierId, items] of supplierGroups) {
                const supplier = Object.values(suppliers).find(s => s.id === supplierId);
                if (!supplier) continue;

                const totalCost = items.reduce((sum, item) => {
                    const product = productsList.find(p => p.id === item.productId);
                    return sum + (Number(product?.costPrice || 0) * Number(item.quantity || 1));
                }, 0);

                const poStatus = randomChoice(['ORDERED', 'SHIPPED', 'RECEIVED']) as typeof schema.poStatusEnum.enumValues[number];

                const [po] = await db.insert(schema.purchaseOrders).values({
                    tenantId: tenant.id,
                    poNo: generateDocNo('PO'),
                    orderId: order.id,
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    type: 'FINISHED' as const,
                    status: poStatus,
                    paymentStatus: poStatus === 'RECEIVED' ? 'PAID' as const : 'PENDING' as const,
                    totalCost: String(totalCost.toFixed(2)),
                    externalPoNo: `EXT-${Date.now()}`,
                    logisticsCompany: poStatus !== 'ORDERED' ? randomChoice(['顺丰速运', '德邦物流']) : null,
                    logisticsNo: poStatus !== 'ORDERED' ? `SF${randomInt(100000000, 999999999)}` : null,
                    sentAt: randomDate(randomInt(5, 10)),
                    shippedAt: poStatus !== 'ORDERED' ? randomDate(randomInt(3, 7)) : null,
                    deliveredAt: poStatus === 'RECEIVED' ? randomDate(randomInt(1, 3)) : null,
                    createdBy: users['13904004001'].id, // 采购员
                    createdAt: order.createdAt,
                }).returning();

                // 创建采购单明细
                for (const item of items) {
                    const product = productsList.find(p => p.id === item.productId);
                    if (!product) continue;

                    await db.insert(schema.purchaseOrderItems).values({
                        poId: po.id,
                        quoteItemId: item.id,
                        productId: product.id,
                        productName: product.name,
                        sku: product.sku,
                        category: product.category,
                        unitCost: product.costPrice || '0',
                        quantity: item.quantity || '1',
                        subtotal: String((Number(product.costPrice) * Number(item.quantity)).toFixed(2)),
                        width: item.width,
                        height: item.height,
                    });
                }
            }
        }

        // 8.2 外协加工单 (Work Orders)
        console.log('📦 第八.二步:外协加工单数据');

        const workOrdersList: typeof schema.workOrders.$inferSelect[] = [];
        // 查询最近的采购单
        const recentPOs = await db.query.purchaseOrders.findMany({
            where: (po, { eq }) => eq(po.type, 'FINISHED'),
            limit: 50,
        });

        for (const po of recentPOs) {
            if (Math.random() > 0.4) continue;

            const [wo] = await db.insert(schema.workOrders).values({
                tenantId: tenant.id,
                woNo: generateDocNo('WO'),
                orderId: po.orderId!,
                poId: po.id,
                supplierId: po.supplierId!,
                status: randomChoice(['PENDING', 'PROCESSING', 'COMPLETED']),
                startAt: po.sentAt,
                completedAt: po.deliveredAt,
                remark: '外协加工订单',
                createdBy: users['13904004001'].id,
                createdAt: po.createdAt,
            }).returning();
            workOrdersList.push(wo);
        }
        console.log(`✅ 外协加工单: ${workOrdersList.length} 个`);

        console.log(`✅ 采购订单: 已生成\n`);

        // ===== 9. 财务层 =====
        console.log('📦 第九步:财务数据');

        // 为订单创建应收账款
        for (const order of ordersList) {
            const salesUserPhone = order.salesId ?
                Object.values(users).find(u => u.id === order.salesId)?.phone || '13901001001' :
                '13901001001';
            const salesUser = users[salesUserPhone];

            const receivedAmount = order.paidAmount;
            const totalAmount = order.totalAmount;
            const pendingAmount = String(Number(totalAmount) - Number(receivedAmount));

            let arStatus: typeof schema.arStatusEnum.enumValues[number] = 'PENDING_PAYMENT';
            if (Number(receivedAmount) === 0) {
                arStatus = 'PENDING_RECON';
            } else if (Number(pendingAmount) > 0) {
                arStatus = 'PARTIAL';
            } else {
                arStatus = 'COMPLETED';
            }

            const [arStatement] = await db.insert(schema.arStatements).values({
                tenantId: tenant.id,
                statementNo: generateDocNo('AR'),
                orderId: order.id,
                customerId: order.customerId,
                salesId: salesUser.id,
                totalAmount,
                paidAmount: receivedAmount,
                status: arStatus,
                createdBy: salesUser.id,
                createdAt: order.createdAt,
                updatedAt: order.createdAt,
            }).returning();

            // 创建收款计划
            const [deposit] = await db.insert(schema.paymentSchedules).values({
                tenantId: tenant.id,
                statementId: arStatement.id,
                orderId: order.id,
                stageName: '定金',
                ratio: '0.50',
                amount: String((Number(totalAmount) * 0.5).toFixed(2)),
                dueDate: order.createdAt,
                paidAt: Number(receivedAmount) > 0 ? order.createdAt : null,
                status: Number(receivedAmount) > 0 ? 'PAID' as const : 'PENDING' as const,
            }).returning();

            await db.insert(schema.paymentSchedules).values({
                tenantId: tenant.id,
                statementId: arStatement.id,
                orderId: order.id,
                stageName: '尾款',
                ratio: '0.50',
                amount: String((Number(totalAmount) * 0.5).toFixed(2)),
                dueDate: order.completedAt || randomDate(-10),
                paidAt: arStatus === 'COMPLETED' ? (order.completedAt || randomDate(5)) : null,
                status: arStatus === 'COMPLETED' ? 'PAID' as const : 'PENDING' as const,
            });

            // 创建收款记录
            if (Number(receivedAmount) > 0) {
                await db.insert(schema.receipts).values({
                    tenantId: tenant.id,
                    receiptNo: generateDocNo('REC'),
                    customerId: order.customerId,
                    orderId: order.id,
                    statementId: arStatement.id,
                    scheduleId: deposit.id,
                    type: 'DEPOSIT',
                    status: 'CONFIRMED',
                    amount: String((Number(totalAmount) * 0.5).toFixed(2)),
                    paymentMethod: randomChoice(['WECHAT', 'ALIPAY', 'BANK_TRANSFER']) as typeof schema.paymentMethodEnum.enumValues[number],
                    paymentProof: null,
                    verifiedAt: order.createdAt,
                    verifiedBy: salesUser.id,
                    createdBy: salesUser.id,
                    createdAt: order.createdAt,
                    updatedAt: order.createdAt,
                });
            }

            if (arStatus === 'COMPLETED') {
                await db.insert(schema.receipts).values({
                    tenantId: tenant.id,
                    receiptNo: generateDocNo('REC'),
                    customerId: order.customerId,
                    orderId: order.id,
                    statementId: arStatement.id,
                    type: 'FINAL_PAYMENT',
                    status: 'CONFIRMED',
                    amount: String((Number(totalAmount) * 0.5).toFixed(2)),
                    paymentMethod: randomChoice(['WECHAT', 'ALIPAY', 'BANK_TRANSFER']) as typeof schema.paymentMethodEnum.enumValues[number],
                    paymentProof: null,
                    verifiedAt: order.completedAt || randomDate(5),
                    verifiedBy: salesUser.id,
                    createdBy: salesUser.id,
                    createdAt: order.completedAt || randomDate(5),
                    updatedAt: order.completedAt || randomDate(5),
                });
            }
        }

        console.log(`✅ 应收账款: ${ordersList.length} 条`);
        console.log(`✅ 收款记录: 已生成\n`);

        // 9.2 佣金与结算 (Commissions & Settlements)
        console.log('📦 第九.二步:佣金与结算数据');

        // 渠道结算 (暂时跳过，因为没有真正的channels表数据)
        // TODO: 需要先创建 channels 表数据才能创建 channel_settlements
        let settlementCount = 0;
        console.log(`✅ 渠道结算: ${settlementCount} 条 (暂时跳过)`);

        // 佣金调整 (Commission Adjustments)
        let commissionCount = 0;
        for (const u of Object.values(users).filter(u => u.role === 'SALES').slice(0, 3)) {
            await db.insert(schema.commissionAdjustments).values({
                tenantId: tenant.id,
                userId: u.id,
                amount: String(randomInt(-200, 500)),
                reason: randomChoice(['业绩达标奖励', '客诉扣款', '全勤奖']),
                adjustmentDate: randomDate(5).toISOString(),
                status: 'APPROVED',
                approvedBy: users['13800000001'].id, // Admin/Manager
                approvedAt: randomDate(2),
                createdBy: users['13800000001'].id,
                createdAt: randomDate(5),
            });
            commissionCount++;
        }
        console.log(`✅ 佣金调整: ${commissionCount} 条\n`);


        // ===== 10. 营销与系统 =====
        console.log('📦 第十步:营销与系统数据');

        // 10.1 客户积分 (Loyalty)
        let loyaltyCount = 0;
        for (const customer of customersList.slice(0, 50)) {
            if (Math.random() > 0.3) {
                const points = randomInt(10, 500);
                await db.insert(schema.loyaltyTransactions).values({
                    tenantId: tenant.id,
                    customerId: customer.id,
                    type: 'EARN',
                    source: 'ORDER',
                    points,
                    balanceAfter: points, // Simplified
                    referenceType: 'ORDER',
                    // referenceId: linked to order if available, skip for now
                    description: '下单积分奖励',
                    createdAt: randomDate(5),
                    createdBy: users['13901001001'].id,
                });
                loyaltyCount++;
            }
        }
        console.log(`✅ 积分流水: ${loyaltyCount} 条`);

        // 10.2 系统公告 & 通知 & 审批
        // 公告
        await db.insert(schema.systemAnnouncements).values({
            tenantId: tenant.id,
            title: '关于五一假期放假安排的通知',
            content: '各位同事：五一劳动节放假安排如下...',
            type: 'INFO',
            startAt: randomDate(5),
            endAt: randomDate(-2), // future date
            isPinned: true,
            createdBy: users['13800000001'].id,
        });

        // 审批流 (Mock)
        // ... (Skipping complex approval logic, just creating records if needed)

        console.log(`✅ 系统数据: 公告/通知已生成\n`);

        console.log('═══════════════════════════════════════');
        console.log('🎉 数据播种全部完成!');
        console.log('═══════════════════════════════════════\n');

        console.log('📊 数据统计汇总:');
        console.log(`   ├─ 用户: ${usersData.length} 个`);
        console.log(`   ├─ 供应商: ${Object.keys(suppliers).length} 个`);
        console.log(`   ├─ 商品: ${productsList.length} 个`);
        console.log(`   ├─ 渠道: ${Object.keys(channels).length} 个`);
        console.log(`   ├─ 客户: ${customersList.length} 个`);
        console.log(`   ├─ 线索: ${leadsList.length} 条`);
        console.log(`   ├─ 报价单: ${quotesList.length} 个`);
        console.log(`   ├─ 订单: ${ordersList.length} 个`);
        console.log(`   ├─ 测量任务: ${measureTasksList.length} 个`);
        console.log(`   ├─ 安装任务: ${installTasksList.length} 个`);
        console.log(`   ├─ 售后工单: ${afterSalesList.length} 个`);
        console.log(`   ├─ 外协加工单: ${workOrdersList.length} 个`);
        console.log(`   ├─ 渠道结算: ${settlementCount} 条`);
        console.log(`   ├─ 佣金调整: ${commissionCount} 条`);
        console.log(`   └─ 积分流水: ${loyaltyCount} 条\n`);

        console.log('🔑 测试账号:');
        console.log('   ├─ 店长: 13800000001 / 123456');
        console.log('   ├─ 销售: 13901001001 / 123456');
        console.log('   ├─ 派单员: 13902002001 / 123456');
        console.log('   ├─ 财务: 13903003001 / 123456');
        console.log('   ├─ 测量师: 13905005001 / 123456');
        console.log('   └─ 安装师: 13906006001 / 123456\n');

        console.log('💡 下一步:');
        console.log('   1. 运行 pnpm dev -p 3000 启动项目');
        console.log('   2. 使用上述账号登录系统');
        console.log('   3. 验证各模块数据展示是否正常\n');

    } catch (error) {
        console.error('❌ 播种失败:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

main();

