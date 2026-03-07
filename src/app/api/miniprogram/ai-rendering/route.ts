/**
 * 小程序 AI 效果图 API Route
 *
 * POST /api/miniprogram/ai-rendering  — 提交效果图生成请求
 * GET  /api/miniprogram/ai-rendering  — 查询历史列表 + 积分余额
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, apiBadRequest, apiServerError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../auth-utils';
import { generateAiRendering } from '@/features/ai-rendering/actions/generate';
import { getMyRenderingHistory, getCreditBalance } from '@/features/ai-rendering/actions/queries';

// ==================== 输入校验 Schema ====================

/** POST 请求 Body 校验 */
const generateBodySchema = z.object({
  /** 原始室内照片 Base64 */
  originalImageBase64: z.string().min(10, '原始照片不能为空'),
  /** 窗帘款式 ID */
  curtainStyleId: z.string().min(1, '请选择窗帘款式'),
  /** 面料描述（文字） */
  fabricDescription: z.string().optional().default(''),
  /** 面料来源 */
  fabricSource: z.enum(['showroom', 'upload']).default('showroom'),
  /** 面料参考图 Base64（fabricSource=upload 时传入） */
  fabricImageBase64: z.string().optional().nullable(),
  /** 用户备注 */
  userNotes: z.string().optional().nullable(),
  /** 当前重试次数（0=首次） */
  retryCount: z.number().int().min(0).max(5).optional().default(0),
});

// ==================== POST — 生成效果图 ====================

export const POST = withMiniprogramAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();

      // 参数校验
      const parsed = generateBodySchema.safeParse(body);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        return apiBadRequest(firstError.message);
      }

      const input = parsed.data;

      // 调用核心 Server Action（内部已处理认证，因为 'use server' 可以访问 auth()）
      const result = await generateAiRendering({
        originalImageBase64: input.originalImageBase64,
        curtainStyleId: input.curtainStyleId,
        fabricDescription: input.fabricDescription,
        fabricSource: input.fabricSource,
        fabricImageBase64: input.fabricImageBase64,
        userNotes: input.userNotes,
        retryCount: input.retryCount,
      });

      if (!result.success) {
        // 业务逻辑失败（积分不足、API 调用失败等）
        return apiError(result.error ?? 'AI 效果图生成失败，请重试', 422);
      }

      logger.info('[AI Rendering] 小程序出图成功', {
        renderingId: result.renderingId,
        creditsUsed: result.creditsUsed,
      });

      return apiSuccess({
        renderingId: result.renderingId,
        resultImageBase64: result.resultImageBase64,
        creditsUsed: result.creditsUsed,
      });
    } catch (error) {
      logger.error('[AI Rendering] 小程序出图异常', { error });
      return apiServerError('AI 效果图生成失败，请稍后重试');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);

// ==================== GET — 查询历史列表 + 积分余额 ====================

export const GET = withMiniprogramAuth(
  async (_request: NextRequest) => {
    try {
      // 并行查询：历史列表 + 积分余额
      const [history, credits] = await Promise.all([getMyRenderingHistory(), getCreditBalance()]);

      return apiSuccess({
        history: history.map((r) => ({
          id: r.id,
          status: r.status,
          resultImageUrl: r.resultImageUrl,
          curtainStyleId: r.curtainStyleId,
          fabricSource: r.fabricSource,
          creditsUsed: r.creditsUsed,
          retryCount: r.retryCount,
          createdAt: r.createdAt?.toISOString?.() ?? null,
        })),
        credits,
      });
    } catch (error) {
      logger.error('[AI Rendering] 查询历史失败', { error });
      return apiServerError('查询渲染历史失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
