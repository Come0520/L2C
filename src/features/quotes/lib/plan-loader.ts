/**
 * 报价方案加载器
 * 用于加载租户的报价方案配置
 */

/**
 * 产品配置
 */
interface ProductConfig {
    category: string;
    name: string;
    unitPrice: number;
    foldRatio: number;
}

/**
 * 方案配置
 */
interface PlanConfig {
    name: string;
    description: string;
    products: Record<string, ProductConfig>;
}

/**
 * 默认报价方案 (用于 E2E 测试和开发)
 */
const DEFAULT_PLANS: Record<string, PlanConfig> = {
    ECONOMIC: {
        name: '经济型',
        description: '基础面料 + 简约配件',
        products: {
            fabric: {
                category: 'FABRIC',
                name: '基础遮光布',
                unitPrice: 45,
                foldRatio: 2,
            },
            sheer: {
                category: 'SHEER',
                name: '基础纱帘',
                unitPrice: 25,
                foldRatio: 2.5,
            },
            track: {
                category: 'ACCESSORY',
                name: '铝合金轨道',
                unitPrice: 30,
                foldRatio: 1,
            },
        },
    },
    STANDARD: {
        name: '标准型',
        description: '中档面料 + 标准配件',
        products: {
            fabric: {
                category: 'FABRIC',
                name: '中高档遮光布',
                unitPrice: 85,
                foldRatio: 2,
            },
            sheer: {
                category: 'SHEER',
                name: '优质纱帘',
                unitPrice: 45,
                foldRatio: 2.5,
            },
            track: {
                category: 'ACCESSORY',
                name: '静音轨道',
                unitPrice: 55,
                foldRatio: 1,
            },
        },
    },
    PREMIUM: {
        name: '豪华型',
        description: '高档面料 + 精品配件',
        products: {
            fabric: {
                category: 'FABRIC',
                name: '进口遮光绒布',
                unitPrice: 150,
                foldRatio: 2.5,
            },
            sheer: {
                category: 'SHEER',
                name: '进口刺绣纱',
                unitPrice: 90,
                foldRatio: 2.5,
            },
            track: {
                category: 'ACCESSORY',
                name: '电动轨道',
                unitPrice: 120,
                foldRatio: 1,
            },
        },
    },
};

/**
 * 加载租户活跃的报价方案
 */
export async function loadActivePlan(_tenantId: string) {
    // 💡 待优化: 从数据库加载租户自定义方案
    return null;
}

/**
 * 获取租户的报价方案列表
 */
export async function fetchQuotePlans(_tenantId: string): Promise<Record<string, PlanConfig>> {
    // 💡 待优化: 从数据库加载租户自定义方案，如无则返回默认方案
    return DEFAULT_PLANS;
}
