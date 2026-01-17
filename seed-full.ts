import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq } from 'drizzle-orm';

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
                passwordHash: '$2a$10$demoPasswordHash',
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
                settlementType: randomChoice(['MONTHLY', 'SINGLE', 'PREPAY']),
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
                basePrice: p.basePrice,
                costPrice: p.costPrice,
                defaultSupplierId: suppliers[p.supplier]?.id,
                isStockable: ['CURTAIN_ACCESSORY', 'STANDARD', 'MOTOR'].includes(p.category),
                stockQuantity: ['CURTAIN_ACCESSORY', 'STANDARD', 'MOTOR'].includes(p.category) ? String(randomInt(100, 1000)) : '0',
                isActive: true,
            }).onConflictDoUpdate({
                target: schema.products.sku,
                set: {
                    name: p.name,
                    basePrice: p.basePrice,
                    costPrice: p.costPrice,
                    updatedAt: new Date(),
                }
            }).returning();

            productsList.push(product);
        }
        console.log(`✅ 商品: ${productsList.length} 个`);

        // 2.3 报价方案
        const quotePlansData = [
            { code: 'ECONOMIC' as const, name: '经济型方案', description: '性价比之选,满足基本需求' },
            { code: 'COMFORT' as const, name: '舒适型方案', description: '品质升级,居家首选' },
            { code: 'LUXURY' as const, name: '豪华型方案', description: '高端定制,尊享品质' },
        ];

        for (const plan of quotePlansData) {
            await db.insert(schema.quotePlans).values({
                tenantId: tenant.id,
                ...plan,
                isActive: true,
            }).onConflictDoNothing();
        }
        console.log(`✅ 报价方案: ${quotePlansData.length} 个`);

        // 2.4 渠道配置
        const channelCategoriesData = [
            { name: '线上渠道', code: 'ONLINE' },
            { name: '线下门店', code: 'OFFLINE' },
            { name: '异业带单', code: 'REFERRAL' },
        ];

        const channelCategories: Record<string, typeof schema.marketChannelCategories.$inferSelect> = {};
        for (const cat of channelCategoriesData) {
            const [category] = await db.insert(schema.marketChannelCategories).values({
                tenantId: tenant.id,
                ...cat,
                isActive: true,
            }).onConflictDoNothing().returning();

            if (category) {
                channelCategories[cat.code] = category;
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
            const [channel] = await db.insert(schema.marketChannels).values({
                tenantId: tenant.id,
                categoryId: channelCategories[ch.category].id,
                name: ch.name,
                code: ch.code,
                isActive: true,
            }).onConflictDoNothing().returning();

            if (channel) {
                channels[ch.code] = channel;
            }
        }
        console.log(`✅ 渠道: ${Object.keys(channels).length} 个\n`);

        // ===== 3. 客户层 =====
        console.log('📦 第三步:客户层数据');

        const customersData: { name: string; phone: string; address: ReturnType<typeof generateChineseAddress>; level: 'A' | 'B' | 'C' | 'D'; salesId: string }[] = [];
        const salesUserPhones = ['13901001001', '13901001002', '13901001003', '13901001004', '13901001005'];

        for (let i = 0; i < 20; i++) {
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
        console.log(`✅ 客户: ${customersList.length} 个\n`);

        // ===== 4. 销售流程层 =====
        console.log('📦 第四步:销售流程层数据');

        // 4.1 线索
        const leadsData = [
            // 待派单 2条
            { status: 'PENDING_DISPATCH' as const, intentionLevel: 'MEDIUM' as const, channel: 'MEITUAN', daysAgo: 1, salesAssigned: null },
            { status: 'PENDING_DISPATCH' as const, intentionLevel: 'HIGH' as const, channel: 'DOUYIN', daysAgo: 0, salesAssigned: null },

            // 跟进中 5条
            { status: 'FOLLOWING' as const, intentionLevel: 'HIGH' as const, channel: 'DIANPING', daysAgo: 5, salesAssigned: '13901001001' },
            { status: 'FOLLOWING' as const, intentionLevel: 'MEDIUM' as const, channel: 'COMMUNITY', daysAgo: 7, salesAssigned: '13901001002' },
            { status: 'FOLLOWING' as const, intentionLevel: 'HIGH' as const, channel: 'CUSTOMER_REFERRAL', daysAgo: 10, salesAssigned: '13901001003' },
            { status: 'FOLLOWING' as const, intentionLevel: 'LOW' as const, channel: 'WALKIN', daysAgo: 12, salesAssigned: '13901001004' },
            { status: 'FOLLOWING' as const, intentionLevel: 'MEDIUM' as const, channel: 'DECORATION', daysAgo: 15, salesAssigned: '13901001005' },

            // 已成交 5条
            { status: 'WON' as const, intentionLevel: 'HIGH' as const, channel: 'MEITUAN', daysAgo: 25, salesAssigned: '13901001001' },
            { status: 'WON' as const, intentionLevel: 'HIGH' as const, channel: 'CUSTOMER_REFERRAL', daysAgo: 30, salesAssigned: '13901001002' },
            { status: 'WON' as const, intentionLevel: 'MEDIUM' as const, channel: 'WALKIN', daysAgo: 35, salesAssigned: '13901001003' },
            { status: 'WON' as const, intentionLevel: 'HIGH' as const, channel: 'DECORATION', daysAgo: 40, salesAssigned: '13901001004' },
            { status: 'WON' as const, intentionLevel: 'HIGH' as const, channel: 'DESIGNER', daysAgo: 45, salesAssigned: '13901001005' },

            // 作废 3条
            { status: 'VOID' as const, intentionLevel: 'LOW' as const, channel: 'OUTDOOR_AD', daysAgo: 50, salesAssigned: '13901001001' },
            { status: 'VOID' as const, intentionLevel: 'LOW' as const, channel: 'XIAOHONGSHU', daysAgo: 55, salesAssigned: '13901001002' },
            { status: 'VOID' as const, intentionLevel: 'LOW' as const, channel: 'WALKIN', daysAgo: 60, salesAssigned: '13901001003' },
        ];

        const leadsList: typeof schema.leads.$inferSelect[] = [];
        for (const [index, ld] of leadsData.entries()) {
            const customer = customersList[index % customersList.length];
            const channel = channels[ld.channel];
            const channelCategory = Object.values(channelCategories).find(cat =>
                Object.values(channels).find(ch => ch.id === channel.id)?.categoryId === cat.id
            );

            const createdAt = randomDate(ld.daysAgo);
            const salesUser = ld.salesAssigned ? users[ld.salesAssigned] : null;

            const [lead] = await db.insert(schema.leads).values({
                tenantId: tenant.id,
                leadNo: generateDocNo('L'),
                sourceCategoryId: channelCategory?.id,
                sourceSubId: channel?.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                community: (customer.addresses as Array<{ community?: string }>)?.[0]?.community || '未知小区',
                address: customer.defaultAddress,
                intentionLevel: ld.intentionLevel,
                estimatedAmount: String(randomInt(5000, 50000)),
                status: ld.status,
                assignedSalesId: salesUser?.id,
                assignedAt: salesUser ? createdAt : null,
                customerId: ld.status === 'WON' ? customer.id : null,
                createdBy: salesUser?.id || users['13800000001'].id,
                createdAt,
                lastActivityAt: randomDate(Math.max(0, ld.daysAgo - randomInt(0, 5))),
                wonAt: ld.status === 'WON' ? randomDate(Math.max(0, ld.daysAgo - 5)) : null,
                lostReason: ld.status === 'VOID' ? randomChoice(['价格太高', '已选其他商家', '暂不需要', '联系不上']) : null,
            }).onConflictDoNothing().returning();

            if (lead) {
                leadsList.push(lead);

                // 为跟进中和已成交的线索添加跟进记录
                if (ld.status === 'FOLLOWING' || ld.status === 'WON') {
                    const followupCount = randomInt(1, 3);
                    for (let i = 0; i < followupCount; i++) {
                        await db.insert(schema.leadFollowupLogs).values({
                            leadId: lead.id,
                            type: randomChoice(['CALL', 'WECHAT', 'VISIT']),
                            content: randomChoice([
                                '电话沟通,客户有意向,预约周末上门量房',
                                '微信发送产品图册,客户表示需要考虑',
                                '客户到店看样,对雪尼尔系列比较感兴趣',
                                '上门量房,测量尺寸并初步报价',
                            ]),
                            result: randomChoice(['CONNECTED', 'INTERESTED', 'FOLLOW_UP']),
                            createdBy: salesUser!.id,
                            createdAt: randomDate(ld.daysAgo - i * 3),
                        });
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
        const followingLeadsWithQuote = leadsList.filter(l => l.status === 'FOLLOWING').slice(0, 3);
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
            const [quote] = await db.insert(schema.quotes).values({
                tenantId: tenant.id,
                quoteNo: generateDocNo('Q'),
                version: 1,
                isLatest: true,
                leadId: lead.id,
                customerId: customer.id,
                status: isActive ? 'LOCKED' as const : 'ACTIVE' as const,
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

            quotesList.push(quote);

            // 创建空间(1-3个空间)
            const roomCount = randomChoice([1, 2, 2, 3]);
            const roomNames = ['客厅', '主卧', '次卧', '书房', '儿童房'];
            const quoteRooms: typeof schema.rooms.$inferSelect[] = [];

            for (let i = 0; i < roomCount; i++) {
                const [room] = await db.insert(schema.rooms).values({
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
                        unitPrice = product.basePrice;
                        subtotal = String(Number(quantity) * Number(unitPrice) * Number(height));
                    }
                    // 第二个商品:纱帘
                    else if (i === 1) {
                        product = productsList.find(p => p.category === 'CURTAIN_SHEER') || productsList[1];
                        width = randomChoice(['2.8', '3.2', '3.5', '4.0']);
                        height = randomChoice(['2.6', '2.7', '2.8']);
                        foldRatio = '2.5';
                        quantity = String(Number(width) * Number(foldRatio));
                        unitPrice = product.basePrice;
                        subtotal = String(Number(quantity) * Number(unitPrice) * Number(height));
                    }
                    // 第三个商品:轨道
                    else {
                        product = productsList.find(p => p.category === 'CURTAIN_TRACK') || productsList[2];
                        width = randomChoice(['2.8', '3.2', '3.5', '4.0']);
                        height = null;
                        foldRatio = null;
                        quantity = '1';
                        unitPrice = product.basePrice;
                        subtotal = String(Number(width) * Number(unitPrice));
                    }

                    await db.insert(schema.quoteItems).values({
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

        const orderStatuses = ['PENDING_PO', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'SHIPPED', 'PENDING_INSTALL', 'COMPLETED'];

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

            const [order] = await db.insert(schema.orders).values(orderValues as typeof schema.orders.$inferInsert).returning();

            ordersList.push(order);
        }

        console.log(`✅ 订单: ${ordersList.length} 个\n`);

        // ===== 7. 服务交付层 =====
        console.log('📦 第七步:服务交付数据');

        // 7.1 测量任务(为部分线索创建)
        const leadsForMeasure = leadsList.filter(l => l.status === 'FOLLOWING' || l.status === 'WON').slice(0, 10);
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

            const status = randomChoice(['COMPLETED', 'COMPLETED', 'PENDING_VISIT', 'PENDING_CONFIRM']) as typeof schema.measureStatusEnum.enumValues[number];
            const createdAt = randomDate(randomInt(10, 30));

            const [measureTask] = await db.insert(schema.measureTasks).values({
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
                    rooms: [
                        { name: '客厅', width: 3200, height: 2700, windowType: 'STRAIGHT' },
                        { name: '主卧', width: 2800, height: 2600, windowType: 'STRAIGHT' },
                    ]
                } : {},
                images: status === 'COMPLETED' ? ['/uploads/measure-1.jpg', '/uploads/measure-2.jpg'] : [],
                createdBy: salesUser.id,
                createdAt,
                completedAt: status === 'COMPLETED' ? randomDate(randomInt(1, 8)) : null,
            }).returning();

            measureTasksList.push(measureTask);
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

        // ===== 8. 供应链层 =====
        console.log('📦 第八步:供应链数据');

        // 为订单创建采购单
        const ordersForPO = ordersList.slice(0, 8);

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
                    type: 'EXTERNAL' as const,
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
        console.log(`   └─ 应收账款: ${ordersList.length} 条\n`);

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

