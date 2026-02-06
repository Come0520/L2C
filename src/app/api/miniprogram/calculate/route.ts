/**
 * 报价价格计算 API
 *
 * POST /api/miniprogram/calculate
 * Body: { productId, width, height, foldRatio, installType }
 * 返回：{ quantity, unitPrice, subtotal, breakdown }
 */
import { NextRequest, NextResponse } from 'next/server';

interface CalcRequest {
    productId: string;
    width: number;      // 窗帘宽度 (m)
    height: number;     // 窗帘高度 (m)
    foldRatio: number;  // 褶皱倍数 (1.5 / 2.0 / 2.5)
    installType?: string; // 安装方式 (track / rod)
    calcType?: string;  // 计算类型 (CURTAIN / LINEAR / FIXED)
    unitPrice?: number; // 单价
    fabricWidth?: number; // 门幅 (m)
}

/**
 * 窗帘用量计算
 * 公式：用量 = (窗帘宽度 * 褶皱倍数) / 门幅 * 窗帘高度
 * 简化版：用量 = 宽度 * 褶皱倍数 (按米计)
 */
function calculateCurtainQuantity(params: CalcRequest): number {
    const { width, height, foldRatio = 2.0, fabricWidth = 2.8 } = params;

    // 计算需要的幅数
    const totalWidth = width * foldRatio;
    const panels = Math.ceil(totalWidth / fabricWidth);

    // 每幅需要的高度（加余量 0.2m）
    const heightWithMargin = height + 0.2;

    // 总用量 = 幅数 * 高度
    const quantity = panels * heightWithMargin;

    return Math.round(quantity * 100) / 100; // 保留2位小数
}

/**
 * 线性计算（轨道等）
 * 公式：用量 = 宽度 + 余量
 */
function calculateLinearQuantity(params: CalcRequest): number {
    const { width } = params;
    // 加 0.2m 余量
    return Math.round((width + 0.2) * 100) / 100;
}

export async function POST(request: NextRequest) {
    try {
        const body: CalcRequest = await request.json();
        const { productId, width, height, foldRatio = 2.0, calcType = 'CURTAIN', unitPrice = 0 } = body;

        // 参数验证
        if (!width || width <= 0) {
            return NextResponse.json({ success: false, error: '请输入有效的宽度' }, { status: 400 });
        }
        if (calcType === 'CURTAIN' && (!height || height <= 0)) {
            return NextResponse.json({ success: false, error: '请输入有效的高度' }, { status: 400 });
        }

        let quantity = 0;
        let breakdown: Record<string, unknown> = {};

        switch (calcType) {
            case 'CURTAIN':
                quantity = calculateCurtainQuantity(body);
                breakdown = {
                    method: '窗帘计算',
                    formula: '(宽度 × 褶皱倍数) ÷ 门幅 × (高度 + 0.2m)',
                    params: { width, height, foldRatio, fabricWidth: body.fabricWidth || 2.8 }
                };
                break;
            case 'LINEAR':
                quantity = calculateLinearQuantity(body);
                breakdown = {
                    method: '线性计算',
                    formula: '宽度 + 0.2m',
                    params: { width }
                };
                break;
            case 'FIXED':
                quantity = 1;
                breakdown = { method: '固定单位', quantity: 1 };
                break;
            default:
                quantity = width * (foldRatio || 1);
                breakdown = { method: '默认计算' };
        }

        const subtotal = Math.round(quantity * unitPrice * 100) / 100;

        return NextResponse.json({
            success: true,
            data: {
                productId,
                quantity,
                unitPrice,
                subtotal,
                breakdown
            }
        });

    } catch (error) {
        console.error('Calculate Error:', error);
        return NextResponse.json({ success: false, error: '计算失败' }, { status: 500 });
    }
}
