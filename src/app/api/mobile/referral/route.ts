/**
 * 客户端 - 推荐返利 API
 * GET /api/mobile/referral/code - 获取推荐码
 * GET /api/mobile/referral/rewards - 获取返利记录
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customers } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireCustomer } from '@/shared/middleware/mobile-auth';

/**
 * 获取推荐码
 */
export async function GET(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireCustomer(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    try {
        // 3. 查找客户
        const customer = await db.query.customers.findFirst({
            where: eq(customers.phone, session.phone),
            columns: {
                id: true,
                name: true,
                phone: true,
            }
        });

        if (!customer) {
            return apiError('客户信息不存在', 404);
        }

        // 4. 生成推荐码（基于客户ID的短码）
        const referralCode = generateReferralCode(customer.id);

        // 5. 生成小程序分享路径
        const sharePath = `/pages/register/index?ref=${referralCode}`;

        // 6. 查询推荐统计（简化处理）
        // 实际应查询 referral_records 表
        const stats = {
            totalReferred: 0,
            successReferred: 0,
            totalRewards: 0,
            pendingRewards: 0,
        };

        return apiSuccess({
            referralCode,
            sharePath,
            qrCodeUrl: null, // 实际应生成小程序码
            stats,
            rules: [
                '邀请好友下单即可获得返利',
                '好友完成安装后，返利自动到账',
                '返利金额 = 订单金额 × 3%',
            ],
        });

    } catch (error) {
        console.error('推荐码获取错误:', error);
        return apiError('获取推荐码失败', 500);
    }
}

/**
 * 生成推荐码
 */
function generateReferralCode(customerId: string): string {
    // 使用客户ID的后8位作为推荐码
    const shortId = customerId.replace(/-/g, '').slice(-8).toUpperCase();
    return `REF${shortId}`;
}
