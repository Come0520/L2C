
import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
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

function generateCurtainFabricProducts(): ProductData[] {
    const products: ProductData[] = [];
    let skuIndex = 1;

    for (const color of CURTAIN_COLORS) {
        for (const pattern of CURTAIN_PATTERNS) {
            for (const material of CURTAIN_MATERIALS) {
                const price = Math.floor(Math.random() * 80) + 20;
                const costPrice = Math.floor(price * 0.6).toString();
                const fabricSize = [280, 300, 320][Math.floor(Math.random() * 3)];

                const images = [
                    `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&auto=format&q=80&sig=${skuIndex}`,
                    `https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=400&fit=crop&auto=format&q=80&sig=${skuIndex + 1}`,
                    `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&auto=format&q=80&sig=${skuIndex + 2}`,
                ];

                products.push({
                    name: `${color}${pattern}${material}窗帘布`,
                    sku: `FAB-${skuIndex.toString().padStart(3, '0')}`,
                    basePrice: price.toString(),
                    costPrice,
                    unit: 'm',
                    category: 'CURTAIN_FABRIC',
                    fabricDirection: 'HEIGHT',
                    fabricSize: fabricSize.toString(),
                    headerProcessType: Math.random() > 0.5 ? 'WRAPPED' : 'ATTACHED',
                    description: `采用优质${material}面料，${color}色调，${pattern}设计，适合现代简约风格家居。幅宽${fabricSize}cm，定高剪裁。`,
                    images,
                    attributes: {
                        color,
                        pattern,
                        material,
                        foldRatio: 2.0,
                        shrinkage: '3%',
                        washable: true,
                        sunProtection: Math.random() > 0.5 ? '50%' : '80%',
                    },
                });

                skuIndex++;
                if (products.length >= 20) break; // Reduced count for speed
            }
            if (products.length >= 20) break;
        }
        if (products.length >= 20) break;
    }

    return products;
}

async function main() {
    console.log('🌱 开始为所有租户播种商品数据...\n');

    // Get all tenants
    const tenants = await db.query.tenants.findMany();
    
    if (tenants.length === 0) {
        console.error('❌ No tenants found.');
        return;
    }

    const products = generateCurtainFabricProducts();
    console.log(`📦 Generated ${products.length} base products`);

    for (const tenant of tenants) {
        console.log(`\n🏢 Processing Tenant: ${tenant.name} (${tenant.code})`);
        
        let successCount = 0;
        let skipCount = 0;

        for (const p of products) {
            // Unique SKU per tenant
            const tenantSku = `${p.sku}-${tenant.code}`;
            
            const existing = await db.query.products.findFirst({
                where: eq(schema.products.sku, tenantSku)
            });

            if (existing) {
                skipCount++;
                continue;
            }

            try {
                await db.insert(schema.products).values({
                    ...p,
                    sku: tenantSku,
                    tenantId: tenant.id,
                    isActive: true,
                    stockQuantity: Math.floor(Math.random() * 1000).toString(),
                });
                successCount++;
            } catch (error) {
                console.error(`   ❌ Failed to insert ${tenantSku}:`, error);
            }
        }
        console.log(`   ✅ Added: ${successCount}, Skipped: ${skipCount}`);
    }

    console.log('\n✨ Done!');
    process.exit(0);
}

main().catch(console.error);
