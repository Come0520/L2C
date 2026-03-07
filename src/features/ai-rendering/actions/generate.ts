'use server';

/**
 * AI 效果图生成核心 Server Action
 *
 * 完整业务流程：
 * 1. 认证与租户隔离
 * 2. 积分余额校验（是否足够）
 * 3. 创建渲染记录（状态 PENDING）
 * 4. 调用 Gemini API 生成效果图
 * 5. 添加水印（根据套餐决定样式）
 * 6. 上传结果图到 OSS（TODO: Phase 2 实现，目前直接使用 Base64）
 * 7. 更新渲染记录为 COMPLETED，扣除积分
 * 8. 返回渲染结果（含效果图 URL）
 *
 * 错误恢复：
 * - 任何步骤失败时，将渲染记录更新为 FAILED
 * - 仅在成功时扣除积分
 */

import { db } from '@/shared/api/db';
import { aiRenderings, aiCurtainStyleTemplates } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { auth } from '@/shared/lib/auth';
import { fileService } from '@/shared/services/file-service';
import { calculateCreditsCost } from '../lib/credits';
import { buildPrompt, generateRendering, CURTAIN_STYLE_PROMPT_MAP } from '../lib/gemini-client';
import { addWatermark, doesImageNeedWatermark } from '../lib/watermark';
import { getCreditBalance } from './queries';

// ==================== 输入验证 ====================

/** generateAiRendering Server Action 输入参数 */
export interface GenerateAiRenderingInput {
  /** 原始室内照片 Base64（不含 data URI 前缀，小程序拍照后传入） */
  originalImageBase64: string;
  /** 窗帘款式 ID（对应 CURTAIN_STYLE_PROMPT_MAP 的 key 或数据库模板 ID） */
  curtainStyleId: string;
  /** 自定义面料描述（如：米白色棉麻、蓝色雪尼尔提花） */
  fabricDescription: string;
  /** 面料来源：showroom=云展厅产品，upload=用户上传图片 */
  fabricSource: 'showroom' | 'upload';
  /** 面料参考图 Base64（选填，fabricSource=upload 时传入） */
  fabricImageBase64?: string | null;
  /** 用户备注（选填） */
  userNotes?: string | null;
  /** 关联客户 ID（选填，用于后续效果图归档） */
  customerId?: string | null;
  /** 当前是第几次重试（0=首次，1=第一次重试） */
  retryCount?: number;
}

/** generateAiRendering Server Action 返回结果 */
export interface GenerateAiRenderingResult {
  success: boolean;
  /** 渲染记录 ID */
  renderingId?: string;
  /** 生成的效果图 Base64（含 data URI 前缀，可直接用于 <img> src） */
  resultImageBase64?: string;
  /** 消耗的积分数 */
  creditsUsed?: number;
  /** 错误信息（成功时为 null） */
  error?: string;
}

// ==================== 核心 Server Action ====================

/**
 * 生成 AI 窗帘效果图
 * 这是 AI 渲染模块的核心入口，聚合积分校验、AI 调用、水印处理全流程
 *
 * @param input 生成参数
 * @returns 生成结果（含效果图或错误信息）
 */
export async function generateAiRendering(
  input: GenerateAiRenderingInput
): Promise<GenerateAiRenderingResult> {
  // === Step 1: 认证校验 ===
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return { success: false, error: '请先登录' };
  }

  const { tenantId, id: userId } = session.user;
  const planType = ((session.user as { planType?: string }).planType ?? 'base') as
    | 'base'
    | 'pro'
    | 'enterprise';

  // 是否为付费套餐（影响水印样式）
  const isPaidPlan = planType !== 'base';
  const tenantName =
    ((session.user as { tenantName?: string }).tenantName ?? '').trim() || '未命名工作室';

  const retryCount = input.retryCount ?? 0;

  // === Step 2: 计算积分消耗 ===
  const creditsNeeded = calculateCreditsCost({
    fabricSource: input.fabricSource,
    retryCount,
  });

  // === Step 3: 积分余额校验（仅扣费时检查）===
  if (creditsNeeded > 0) {
    const balance = await getCreditBalance();
    if (balance.remaining < creditsNeeded) {
      return {
        success: false,
        error: `积分不足：当月剩余 ${balance.remaining} 点，本次需要 ${creditsNeeded} 点。请联系管理员增加额度。`,
      };
    }
  }

  // === Step 4: 解析款式 Prompt（优先从数据库读取，回退到硬编码 Map） ===
  let curtainStyleName: string;
  let curtainStylePrompt: string;

  // 尝试从数据库读取（平台管理页面配置的模板）
  const [dbTemplate] = await db
    .select({ name: aiCurtainStyleTemplates.name, promptFragment: aiCurtainStyleTemplates.promptFragment })
    .from(aiCurtainStyleTemplates)
    .where(eq(aiCurtainStyleTemplates.id, input.curtainStyleId))
    .limit(1);

  if (dbTemplate) {
    curtainStyleName = dbTemplate.name;
    curtainStylePrompt = dbTemplate.promptFragment ?? dbTemplate.name;
  } else {
    // 回退到代码内置的款式映射（兼容旧数据）
    const styleEntry = CURTAIN_STYLE_PROMPT_MAP[input.curtainStyleId];
    curtainStyleName = styleEntry?.name ?? input.curtainStyleId;
    curtainStylePrompt = styleEntry?.prompt ?? input.curtainStyleId;
  }

  // === Step 5: 创建渲染记录（PENDING 状态）===
  let renderingId: string | undefined;
  try {
    const [record] = await db
      .insert(aiRenderings)
      .values({
        tenantId,
        userId,
        originalImageUrl: `data:image/jpeg;base64,${input.originalImageBase64.slice(0, 20)}...`,
        curtainStyleId: null, // curtainStyleId 在 schema 中关联的是 UUID，当前用字符串 key，不关联
        fabricSource: input.fabricSource,
        userNotes: input.userNotes ?? null,
        status: 'pending',
        creditsUsed: 0,
        retryCount,
        aiPrompt: buildPrompt({
          curtainStyleName,
          curtainStylePrompt,
          fabricDescription: input.fabricDescription,
          userNotes: input.userNotes ?? null,
          cameraAngle: null,
        }),
      })
      .returning({ id: aiRenderings.id });

    renderingId = record?.id;
  } catch (dbErr) {
    console.error('[AI Rendering] 创建记录失败:', dbErr);
    return { success: false, error: '创建渲染任务失败，请重试' };
  }

  // === Step 6: 构建 Prompt & 调用 Gemini ===
  try {
    const prompt = buildPrompt({
      curtainStyleName,
      curtainStylePrompt,
      fabricDescription: input.fabricDescription,
      userNotes: input.userNotes ?? null,
      cameraAngle: null,
    });

    const result = await generateRendering({
      originalImageBase64: input.originalImageBase64,
      prompt,
      fabricImageBase64: input.fabricImageBase64 ?? null,
    });

    // === Step 7: 水印处理 ===
    let finalImageBase64 = result.imageBase64;
    if (doesImageNeedWatermark({ isPaidPlan })) {
      try {
        const imageBuffer = Buffer.from(result.imageBase64, 'base64');
        const watermarkedBuffer = await addWatermark({
          imageBuffer,
          config: {
            tenantName,
            isPaidPlan,
          },
        });
        finalImageBase64 = watermarkedBuffer.toString('base64');
      } catch (wmErr) {
        // 水印失败不中断主流程，使用原图
        console.warn('[AI Rendering] 水印处理失败，使用原图:', wmErr);
      }
    }

    // === Step 8: 上传至 OSS 并更新记录为成功 ===
    if (renderingId) {
      let resultUrl = '';
      try {
        const buffer = Buffer.from(finalImageBase64, 'base64');
        const objectName = `ai-renderings/${tenantId}/${renderingId}.jpg`;
        const uploadRes = await fileService.uploadFile(objectName, buffer);
        if (uploadRes.success && uploadRes.url) {
          resultUrl = uploadRes.url;
        } else {
          resultUrl = `data:${result.mimeType};base64,${finalImageBase64}`;
          console.warn('[AI Rendering] OSS 上传失败，回退使用 Base64');
        }
      } catch (ossErr) {
        console.error('[AI Rendering] OSS 上传抛出异常:', ossErr);
        resultUrl = `data:${result.mimeType};base64,${finalImageBase64}`;
      }

      await db
        .update(aiRenderings)
        .set({
          status: 'completed',
          resultImageUrl: resultUrl,
          creditsUsed: creditsNeeded,
        })
        .where(eq(aiRenderings.id, renderingId));
    }

    // 清除缓存
    revalidateTag(`ai-renderings-${tenantId}`, {});

    return {
      success: true,
      renderingId,
      resultImageBase64: `data:${result.mimeType};base64,${finalImageBase64}`,
      creditsUsed: creditsNeeded,
    };
  } catch (err) {
    // === 错误恢复：更新记录为失败 ===
    if (renderingId) {
      await db
        .update(aiRenderings)
        .set({
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : '未知错误',
        })
        .where(eq(aiRenderings.id, renderingId));
    }

    console.error('[AI Rendering] 生成失败:', err);
    return {
      success: false,
      renderingId,
      error: err instanceof Error ? err.message : 'AI 效果图生成失败，请重试',
    };
  }
}
