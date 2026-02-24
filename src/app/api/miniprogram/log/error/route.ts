/**
 * 小程序端 - 错误日志批量上报 API
 * POST /api/miniprogram/log/error
 * 
 * 接收小程序 ErrorReporter 批量发送的运行时异常数据，
 * 记录到结构化日志系统中，支持后续排查与告警。
 * 
 * 安全策略：需验证小程序 Token，防止匿名滥用。
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createLogger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';
import { withRateLimit, getRateLimitKey } from '@/shared/middleware/rate-limiter';

const log = createLogger('miniprogram:log:error');

/**
 * 单条错误日志的校验 Schema
 */
const errorItemSchema = z.object({
    /** 错误消息 */
    message: z.string().max(2000),
    /** 错误堆栈（可选） */
    stack: z.string().max(5000).optional(),
    /** 错误类型 */
    type: z.enum(['JS_ERROR', 'PROMISE_ERROR', 'API_ERROR', 'WX_ERROR']),
    /** 发生页面路径 */
    path: z.string().max(200).optional(),
    /** 时间戳 (ms) */
    timestamp: z.number(),
    /** 附加上下文数据 */
    metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * 批量上报请求体 Schema
 */
const batchErrorSchema = z.object({
    errors: z.array(errorItemSchema).min(1).max(50),
});

/**
 * 错误上报处理函数
 */
async function errorLogHandler(request: NextRequest) {
    // 1. 认证 — 需要合法的小程序 Token
    const user = await getMiniprogramUser(request);
    if (!user) {
        return NextResponse.json(
            { success: false, error: '未授权' },
            { status: 401 }
        );
    }

    // 2. 解析请求体
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: '请求体格式错误' },
            { status: 400 }
        );
    }

    // 3. 校验数据
    const parseResult = batchErrorSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { success: false, error: '数据校验失败', details: parseResult.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const { errors } = parseResult.data;

    // 4. 结构化日志记录 — 按错误类型分组输出
    const grouped = errors.reduce<Record<string, number>>((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
    }, {});

    // 记录汇总日志
    log.info('小程序错误日志批量上报', {
        userId: user.id,
        tenantId: user.tenantId,
        count: errors.length,
        typeSummary: grouped,
    });

    // 记录每条错误的详细信息（生产环境可接入告警系统）
    for (const err of errors) {
        log.warn('小程序运行时异常', {
            userId: user.id,
            tenantId: user.tenantId,
            errorType: err.type,
            message: err.message,
            path: err.path,
            timestamp: new Date(err.timestamp).toISOString(),
            metadata: err.metadata,
        });
    }

    // 5. 返回成功
    return NextResponse.json({
        success: true,
        data: {
            received: errors.length,
            processedAt: new Date().toISOString(),
        },
    });
}

// 应用速率限制：1 分钟内最多 30 次批量上报
export const POST = withRateLimit(
    errorLogHandler,
    { windowMs: 60 * 1000, maxAttempts: 30, message: '上报频率过高，请稍后重试' },
    getRateLimitKey('miniprogram:log:error')
);
