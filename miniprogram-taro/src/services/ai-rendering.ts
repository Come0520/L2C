/**
 * 前端 API 服务 — AI 效果图
 * 封装小程序端与后端 API 的通信，统一处理 JWT 认证头
 */
import { request } from '@/utils/request';

// ==================== 类型定义 ====================

/** 生成效果图请求参数 */
export interface GenerateRenderingParams {
    originalImageBase64: string;
    curtainStyleId: string;
    fabricDescription: string;
    fabricSource: 'showroom' | 'upload';
    fabricImageBase64?: string | null;
    userNotes?: string | null;
    retryCount?: number;
}

/** 生成效果图响应 */
export interface GenerateRenderingResponse {
    renderingId: string;
    resultImageBase64: string;
    creditsUsed: number;
}

/** 积分余额 */
export interface CreditBalance {
    total: number;
    used: number;
    remaining: number;
    planType: string;
}

/** 历史记录项 */
export interface RenderingHistoryItem {
    id: string;
    status: 'pending' | 'completed' | 'failed';
    resultImageUrl: string | null;
    curtainStyleId: string | null;
    fabricSource: string;
    creditsUsed: number;
    retryCount: number;
    createdAt: string | null;
}

// ==================== API 调用 ====================

/**
 * 发起 AI 效果图生成请求
 * @param params 生成参数
 * @returns 生成结果（含效果图 Base64）
 */
export async function generateRendering(
    params: GenerateRenderingParams
): Promise<GenerateRenderingResponse> {
    return request<GenerateRenderingResponse>('/api/miniprogram/ai-rendering', {
        method: 'POST',
        data: params,
    });
}

/**
 * 获取效果图历史列表和积分余额
 * @returns 历史列表 + 积分余额
 */
export async function getRenderingHistory(): Promise<{
    history: RenderingHistoryItem[];
    credits: CreditBalance;
}> {
    return request<{ history: RenderingHistoryItem[]; credits: CreditBalance }>(
        '/api/miniprogram/ai-rendering',
        { method: 'GET' }
    );
}
