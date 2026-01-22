import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { sql } from 'drizzle-orm';
import {
    handleWebhookRequest,
    WebhookLeadPayload,
    WebhookResponse
} from '@/features/leads/logic/webhook-handler';
import { checkRateLimit, isRedisConfigured } from '@/shared/lib/rate-limit';

// 限流配置常量
const RATE_LIMIT = 100;

/**
 * POST /api/v1/leads/webhook
 * 
 * 接收外部平台推送的线索数据 (抖音、美团、小红书等)
 * 
 * Headers:
 * - Access-Token: 租户的 Webhook 访问令牌 (必填)
 * - X-Tenant-Id: 租户ID (可选，若 token 能唯一确定租户则不需要)
 * 
 * Body: WebhookLeadPayload
 */
export async function POST(request: NextRequest) {
    try {
        // 1. 获取并验证 Access-Token
        const accessToken = request.headers.get('Access-Token');
        if (!accessToken) {
            return NextResponse.json(
                { code: 401, message: 'Unauthorized: Access-Token is required' },
                { status: 401 }
            );
        }

        // 2. 限流检查（优先使用 Redis，自动降级到内存）
        const rateCheck = await checkRateLimit(accessToken);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    code: 429,
                    message: 'Too Many Requests',
                    data: {
                        limit: RATE_LIMIT,
                        remaining: rateCheck.remaining,
                        reset_at: rateCheck.resetAt.toISOString(),
                        rate_limit_source: rateCheck.source // 调试信息：显示使用的限流来源
                    }
                },
                { status: 429 }
            );
        }

        // 3. 根据 Token 查找租户 (优化: 使用 JSON 操作符直接查询)
        // 假设 settings 字段结构为 { "webhookAccessToken": "..." }
        // 注意：PostgreSQL JSONB 查询语法
        const matchedTenant = await db.query.tenants.findFirst({
            where: sql`settings->>'webhookAccessToken' = ${accessToken}`,
            columns: { id: true }
        });

        if (!matchedTenant) {
            return NextResponse.json(
                { code: 401, message: 'Unauthorized: Invalid Access-Token' },
                { status: 401 }
            );
        }

        const matchedTenantId = matchedTenant.id;

        // 4. 解析请求体
        let payload: WebhookLeadPayload;
        try {
            payload = await request.json();
        } catch {
            return NextResponse.json(
                { code: 400, message: 'Bad Request: Invalid JSON body' },
                { status: 400 }
            );
        }

        // 5. 处理 Webhook 请求
        // 使用系统用户ID作为创建者 (可配置为租户的默认用户)
        const systemUserId = 'system'; // TODO: 从租户配置获取默认用户ID

        const result: WebhookResponse = await handleWebhookRequest(
            payload,
            matchedTenantId,
            systemUserId
        );

        // 6. 返回响应
        return NextResponse.json(result, { status: result.code });

    } catch (error: unknown) {
        console.error('Webhook error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { code: 500, message: `Internal Server Error: ${message}` },
            { status: 500 }
        );
    }
}

/**
 * GET /api/v1/leads/webhook
 * 健康检查
 */
export async function GET() {
    return NextResponse.json({
        code: 200,
        message: 'Leads Webhook API is running',
        version: 'v1',
        rate_limit: {
            enabled: true,
            limit_per_minute: RATE_LIMIT,
            storage: isRedisConfigured() ? 'redis' : 'memory'
        }
    });
}
