import 'dotenv/config';
import { db } from '@/shared/api/db';
import * as schema from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

interface ProductData {
    name: string;
    sku: string;
    basePrice: string;
    costPrice?: string;
    unit: string;
    category: (typeof schema.productCategoryEnum.enumValues)[number];
    fabricDirection?: (typeof schema.fabricDirectionEnum.enumValues)[number];
    fabricSize?: string;
    headerProcessType?: (typeof schema.headerProcessTypeEnum.enumValues)[number];
    description: string;
    images: string[];
    attributes?: Record<string, unknown>;
}

const CURTAIN_COLORS = [
    '珍珠白', '米灰', '深蓝', '浅咖', '香槟金', '浅粉', '薄荷绿', '浅紫', '象牙白', '浅黄',
    '深灰', '墨绿', '酒红', '藏青', '卡其', '浅蓝', '浅灰蓝', '奶油白', '浅棕', '深棕'
];

const CURTAIN_PATTERNS = [
    '纯色', '条纹', '格纹', '花卉', '几何', '抽象', '渐变', '刺绣', '提花', '植绒'
];

const CURTAIN_MATERIALS = [
    '棉麻', '雪尼尔', '丝绒', '亚麻', '涤纶', '真丝', '棉', '麻', '混纺', '天鹅绒'
];

function generateCurtainFabricProducts(prefix: string): ProductData[] {
    const products: ProductData[] = [];
    let skuIndex = 1;

    for (const color of CURTAIN_COLORS) {
        for (const pattern of CURTAIN_PATTERNS) {
            for (const material of CURTAIN_MATERIALS) {
                const price = Math.floor(Math.random() * 80) + 20;
                const costPrice = Math.floor(price * 0.6);
                const fabricSize = [280, 300, 320][Math.floor(Math.random() * 3)];

                products.push({
                    name: `${color}${pattern}${material}窗帘布`,
                    sku: `${prefix}-FAB-${skuIndex.toString().padStart(3, '0')}`,
                    basePrice: price.toString(),
                    costPrice: costPrice.toString(),
                    unit: 'm',
                    category: 'CURTAIN_FABRIC',
                    fabricDirection: 'HEIGHT',
                    fabricSize: fabricSize.toString(),
                    headerProcessType: Math.random() > 0.5 ? 'WRAPPED' : 'ATTACHED',
                    description: `采用优质${material}面料，${color}色调，${pattern}设计。幅宽${fabricSize}cm。`,
                    images: [],
                    attributes: { color, pattern, material, foldRatio: 2.0 },
                });

                skuIndex++;
                if (products.length >= 60) break;
            }
            if (products.length >= 60) break;
        }
        if (products.length >= 60) break;
    }

    return products;
}

function generateCurtainSheerProducts(prefix: string): ProductData[] {
    const products: ProductData[] = [];
    const sheerColors = ['白色', '米白', '浅灰', '浅蓝', '浅粉', '浅紫', '浅黄', '浅绿'];
    const sheerMaterials = ['雪纺', '纱', '网纱', '蕾丝', '乔其纱'];

    let skuIndex = 1;

    for (const color of sheerColors) {
        for (const material of sheerMaterials) {
            const price = Math.floor(Math.random() * 30) + 10;
            const costPrice = Math.floor(price * 0.5);
            const fabricSize = [280, 300][Math.floor(Math.random() * 2)];

            products.push({
                name: `${color}${material}纱帘`,
                sku: `${prefix}-SHEER-${skuIndex.toString().padStart(3, '0')}`,
                basePrice: price.toString(),
                costPrice: costPrice.toString(),
                unit: 'm',
                category: 'CURTAIN_SHEER',
                fabricDirection: 'HEIGHT',
                fabricSize: fabricSize.toString(),
                description: `${color}${material}纱帘，轻盈透气，透光率70%。`,
                images: [],
                attributes: { color, material, transparency: '70%' },
            });

            skuIndex++;
            if (products.length >= 20) break;
        }
        if (products.length >= 20) break;
    }

    return products;
}

function generateCurtainTrackProducts(prefix: string): ProductData[] {
    const products: ProductData[] = [];
    const trackTypes = ['明装轨道', '暗装轨道', '伸缩轨道', '电动轨道'];
    const trackMaterials = ['铝合金', '不锈钢', '塑钢'];

    let skuIndex = 1;

    for (const type of trackTypes) {
        for (const material of trackMaterials) {
            const price = Math.floor(Math.random() * 50) + 30;
            const costPrice = Math.floor(price * 0.5);

            products.push({
                name: `${material}${type}`,
                sku: `${prefix}-TRACK-${skuIndex.toString().padStart(3, '0')}`,
                basePrice: price.toString(),
                costPrice: costPrice.toString(),
                unit: 'm',
                category: 'CURTAIN_TRACK',
                description: `${material}材质${type}，承重能力强，静音滑轮。`,
                images: [],
                attributes: { type, material, maxLoad: '50kg' },
            });

            skuIndex++;
            if (products.length >= 12) break;
        }
        if (products.length >= 12) break;
    }

    return products;
}

function generateAccessoryProducts(prefix: string): ProductData[] {
    const products: ProductData[] = [];
    const accessoryTypes = [
        { name: '绑带', price: 15, unit: '对' },
        { name: '抱枕', price: 45, unit: '个' },
        { name: '花边', price: 8, unit: 'm' },
        { name: '罗马杆', price: 60, unit: 'm' },
        { name: '挂钩', price: 5, unit: '个' },
        { name: '帘头', price: 25, unit: 'm' },
    ];

    let skuIndex = 1;

    for (const accessory of accessoryTypes) {
        for (let i = 1; i <= 5; i++) {
            products.push({
                name: `${accessory.name}${i}号`,
                sku: `${prefix}-ACC-${skuIndex.toString().padStart(3, '0')}`,
                basePrice: (accessory.price + (i - 1) * 5).toString(),
                costPrice: Math.floor(accessory.price * 0.4).toString(),
                unit: accessory.unit,
                category: 'CURTAIN_ACCESSORY',
                description: `优质${accessory.name}，提升整体装饰效果。`,
                images: [],
                attributes: { type: accessory.name },
            });
            skuIndex++;
        }
    }

    return products;
}

function generateWallclothProducts(prefix: string): ProductData[] {
    const products: ProductData[] = [];
    const styles = ['简约', '北欧', '现代', '中式', '欧式', '美式', '日式', '工业风'];
    const colors = ['米白', '浅灰', '浅蓝', '浅绿', '浅粉', '浅黄', '浅棕', '深灰'];

    let skuIndex = 1;

    for (const style of styles) {
        for (const color of colors) {
            const price = Math.floor(Math.random() * 40) + 15;

            products.push({
                name: `${style}${color}墙纸`,
                sku: `${prefix}-WP-${skuIndex.toString().padStart(3, '0')}`,
                basePrice: price.toString(),
                costPrice: Math.floor(price * 0.5).toString(),
                unit: 'roll',
                category: 'WALLCLOTH',
                description: `${style}风格${color}墙纸，环保材质，透气防霉。`,
                images: [],
                attributes: { style, color, width: '53cm', length: '10m' },
            });

            skuIndex++;
            if (products.length >= 30) break;
        }
        if (products.length >= 30) break;
    }

    return products;
}

function generateWallPanelProducts(prefix: string): ProductData[] {
    const products: ProductData[] = [];
    const materials = ['实木', '复合板', '竹纤维', 'PU皮'];
    const styles = ['简约', '欧式', '中式', '现代'];

    let skuIndex = 1;

    for (const material of materials) {
        for (const style of styles) {
            const price = Math.floor(Math.random() * 100) + 80;

            products.push({
                name: `${material}${style}墙板`,
                sku: `${prefix}-PANEL-${skuIndex.toString().padStart(3, '0')}`,
                basePrice: price.toString(),
                costPrice: Math.floor(price * 0.5).toString(),
                unit: 'm²',
                category: 'WALLPANEL',
                description: `${material}材质${style}墙板，隔音隔热，环保无甲醛。`,
                images: [],
                attributes: { material, style, thickness: '9mm' },
            });
            skuIndex++;
        }
    }

    return products;
}

function generateMotorProducts(prefix: string): ProductData[] {
    const motorTypes = [
        { name: '单电机', price: 280 },
        { name: '双电机', price: 480 },
        { name: '智能电机', price: 580 },
        { name: '静音电机', price: 380 },
    ];

    return motorTypes.map((motor, index) => ({
        name: motor.name,
        sku: `${prefix}-MOTOR-${(index + 1).toString().padStart(3, '0')}`,
        basePrice: motor.price.toString(),
        costPrice: Math.floor(motor.price * 0.5).toString(),
        unit: '套',
        category: 'MOTOR' as const,
        description: `高品质${motor.name}，支持遥控、APP控制。`,
        images: [],
        attributes: { type: motor.name, voltage: '220V' },
    }));
}

function generateWindowPadProducts(prefix: string): ProductData[] {
    const products: ProductData[] = [];
    const materials = ['海绵', '记忆棉', '乳胶', '棉麻'];
    const colors = ['米白', '浅灰', '浅蓝', '浅粉', '浅棕'];

    let skuIndex = 1;

    for (const material of materials) {
        for (const color of colors) {
            const price = Math.floor(Math.random() * 80) + 40;

            products.push({
                name: `${material}${color}飘窗垫`,
                sku: `${prefix}-PAD-${skuIndex.toString().padStart(3, '0')}`,
                basePrice: price.toString(),
                costPrice: Math.floor(price * 0.5).toString(),
                unit: '套',
                category: 'WINDOWPAD',
                description: `${material}材质${color}飘窗垫，柔软舒适，可拆洗。`,
                images: [],
                attributes: { material, color, thickness: '8cm' },
            });

            skuIndex++;
            if (products.length >= 20) break;
        }
        if (products.length >= 20) break;
    }

    return products;
}

async function main() {
    console.log('🌱 开始为 MINIMAL 租户播种商品数据...\n');

    // 查找 MINIMAL 租户
    const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.code, 'MINIMAL')
    });

    if (!tenant) {
        console.error('❌ Error: MINIMAL 租户不存在');
        process.exit(1);
    }

    console.log(`🏢 租户: ${tenant.name} (${tenant.code})\n`);

    const prefix = 'MIN';
    const allProducts: ProductData[] = [
        ...generateCurtainFabricProducts(prefix),
        ...generateCurtainSheerProducts(prefix),
        ...generateCurtainTrackProducts(prefix),
        ...generateAccessoryProducts(prefix),
        ...generateWallclothProducts(prefix),
        ...generateWallPanelProducts(prefix),
        ...generateMotorProducts(prefix),
        ...generateWindowPadProducts(prefix),
    ];

    console.log(`📦 准备插入 ${allProducts.length} 个商品\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const p of allProducts) {
        const existing = await db.query.products.findFirst({
            where: eq(schema.products.sku, p.sku)
        });

        if (existing) {
            console.log(`   ⚠️  跳过 ${p.sku} (已存在)`);
            skipCount++;
            continue;
        }

        try {
            await db.insert(schema.products).values({
                ...p,
                tenantId: tenant.id,
                isActive: true,
                stockQuantity: Math.floor(Math.random() * 1000).toString(),
            });
            console.log(`   ✅ 插入 ${p.name} (${p.sku}) - ¥${p.basePrice}/${p.unit}`);
            successCount++;
        } catch (error) {
            console.error(`   ❌ 插入失败 ${p.sku}:`, error);
        }
    }

    console.log(`\n✨ 完成!`);
    console.log(`   ✅ 成功插入: ${successCount} 个`);
    console.log(`   ⚠️  跳过: ${skipCount} 个`);
    console.log(`   📊 总计: ${allProducts.length} 个商品`);

    process.exit(0);
}

main().catch(console.error);
