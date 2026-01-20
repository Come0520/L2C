/**
 * 销售端 - 快速报价 API
 * POST /api/mobile/quotes/quick
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';

/**
 * 快速报价请求体
 */
interface QuickQuoteBody {
    category: 'CURTAIN' | 'WALLCLOTH' | 'BLINDS';  // 品类
    windowCount: number;                            // 窗户数量
    avgWidth?: number;                              // 平均宽度 (m)
    avgHeight?: number;                             // 平均高度 (m)
    grade: 'ECONOMY' | 'STANDARD' | 'PREMIUM';      // 档位
    installType?: 'TOP' | 'SIDE';                   // 安装方式
    hasElectric?: boolean;                           // 是否电动
}

/**
 * 价格档位配置（每米单价）
 */
const PRICE_CONFIG = {
    CURTAIN: {
        ECONOMY: { fabric: 80, track: 30, labor: 50 },
        STANDARD: { fabric: 150, track: 50, labor: 80 },
        PREMIUM: { fabric: 300, track: 100, labor: 120 },
    },
    WALLCLOTH: {
        ECONOMY: { fabric: 60, track: 0, labor: 40 },
        STANDARD: { fabric: 120, track: 0, labor: 60 },
        PREMIUM: { fabric: 250, track: 0, labor: 100 },
    },
    BLINDS: {
        ECONOMY: { fabric: 100, track: 0, labor: 60 },
        STANDARD: { fabric: 200, track: 0, labor: 100 },
        PREMIUM: { fabric: 400, track: 0, labor: 150 },
    },
};

const ELECTRIC_MOTOR_PRICE = 800;  // 电机单价

export async function POST(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireSales(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    // 3. 解析请求体
    let body: QuickQuoteBody;
    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const {
        category,
        windowCount,
        avgWidth = 2,
        avgHeight = 2.5,
        grade,
        hasElectric = false
    } = body;

    // 4. 参数校验
    if (!category || !windowCount || !grade) {
        return apiError('缺少必要参数: category, windowCount, grade', 400);
    }

    if (windowCount <= 0 || windowCount > 50) {
        return apiError('窗户数量应在 1-50 之间', 400);
    }

    // 5. 计算报价
    const prices = PRICE_CONFIG[category]?.[grade];
    if (!prices) {
        return apiError('无效的品类或档位', 400);
    }

    // 计算面积
    const totalArea = windowCount * avgWidth * avgHeight;
    const totalWidth = windowCount * avgWidth;

    // 各项费用
    const fabricCost = Math.round(totalArea * prices.fabric);
    const trackCost = Math.round(totalWidth * prices.track);
    const laborCost = Math.round(windowCount * prices.labor);
    const electricCost = hasElectric ? windowCount * ELECTRIC_MOTOR_PRICE : 0;

    // 总价
    const subtotal = fabricCost + trackCost + laborCost + electricCost;
    const total = subtotal;

    // 6. 返回报价结果
    return apiSuccess({
        input: {
            category,
            windowCount,
            avgWidth,
            avgHeight,
            grade,
            hasElectric,
        },
        calculation: {
            totalArea: Math.round(totalArea * 100) / 100,
            totalWidth: Math.round(totalWidth * 100) / 100,
        },
        breakdown: {
            fabricCost,
            trackCost,
            laborCost,
            electricCost,
        },
        total,
        priceRange: {
            min: Math.round(total * 0.9),  // 九折
            max: Math.round(total * 1.1),  // 上浮10%
        },
        note: '此为估算价格，实际以测量数据为准',
        gradeDescription: getGradeDescription(grade),
    });
}

function getGradeDescription(grade: string): string {
    const map: Record<string, string> = {
        'ECONOMY': '经济型：基础面料，满足基本需求',
        'STANDARD': '品质型：中档面料，性价比之选',
        'PREMIUM': '高端型：进口面料，品质保证',
    };
    return map[grade] || '';
}
