/**
 * Gemini API 客户端封装
 *
 * 封装 Google Gemini Nano Banana 2 API 用于 AI 窗帘效果图生成。
 * 采用 multimodal（图像 + 文本）输入，返回生成的效果图。
 *
 * 环境变量要求：
 * - GEMINI_API_KEY：Google AI Studio API Key
 *
 * @see https://ai.google.dev/gemini-api/docs/image-understanding
 */

import { GoogleGenAI } from '@google/genai';
import aiPromptsConfig from '../../../../config/ai-prompts.json';

// ==================== 款式 Prompt 映射 ====================

/** 单个窗帘款式的元数据 */
export interface CurtainStylePrompt {
    /** 款式中文名称 */
    name: string;
    /** 传递给 Gemini 的款式英文/专业 Prompt 描述 */
    prompt: string;
}

/**
 * 预设窗帘款式 → Prompt 映射表
 * 与数据库 ai_curtain_style_templates 表协同，此为代码内置默认值
 */
export const CURTAIN_STYLE_PROMPT_MAP: Record<string, CurtainStylePrompt> = {
    track_double_open: {
        name: '轨道双开帘',
        prompt:
            'Track curtains, double panel, opening from center, naturally draping fabric, clean folds, realistic lighting',
    },
    track_single_open: {
        name: '轨道单开帘',
        prompt:
            'Track curtains, single panel, side opening, elegant drape, soft natural folds, interior design photo',
    },
    roman_blind: {
        name: '罗马帘',
        prompt:
            'Roman blind, flat fold style, neat horizontal pleats, mounted inside window frame, interior photography',
    },
    roller_blind: {
        name: '卷帘',
        prompt:
            'Roller blind, clean smooth surface, precision-rolled fabric, minimalist design, natural window light',
    },
    venetian_blind: {
        name: '百叶帘',
        prompt:
            'Venetian blind, horizontal aluminum slats, adjustable angle, modern office or bedroom style',
    },
    sheer_curtain: {
        name: '纱帘',
        prompt:
            'Sheer voile curtain, translucent lightweight fabric, diffused natural light, airy romantic atmosphere',
    },
    double_layer: {
        name: '双层帘（遮光+纱）',
        prompt:
            'Double-layer curtain system, opaque blackout layer and sheer voile layer, layered depth, elegant interior',
    },
    s_wave: {
        name: 'S 型波浪帘',
        prompt:
            'S-fold wave curtains, evenly spaced ripple pleats, contemporary styling, smooth fabric texture',
    },
    eyelet_curtain: {
        name: '打孔式挂钩帘',
        prompt:
            'Eyelet ring-top curtains, metal rings, casual yet elegant drape, full length floor-to-ceiling style',
    },
    waterfall_pleat: {
        name: '瀑布褶帘',
        prompt:
            'Pinch pleat curtains, traditional waterfall folds, formal living room style, rich fabric depth',
    },
};

// ==================== Prompt 构建 ====================

/** buildPrompt 输入参数 */
export interface BuildPromptParams {
    /** 窗帘款式名称（中文） */
    curtainStyleName: string;
    /** 款式专业 Prompt 描述 */
    curtainStylePrompt: string;
    /** 面料描述（颜色 + 材质） */
    fabricDescription: string;
    /** 用户额外备注（可为空） */
    userNotes: string | null;
    /** 视角信息（可为空，Phase 2+ 支持） */
    cameraAngle: { x: number; y: number; z: number } | null;
}

/**
 * 构建发送给 Gemini 的 Prompt 文本
 * 纯函数，无副作用，便于单元测试
 *
 * @param params 构建参数
 * @returns 完整的 Prompt 字符串
 */
export function buildPrompt(params: BuildPromptParams): string {
    const { curtainStyleName, curtainStylePrompt, fabricDescription, userNotes, cameraAngle } =
        params;

    // 从 JSON 配置文件读取 Prompt 模板（相公可直接编辑 config/ai-prompts.json 调教效果）
    const template = aiPromptsConfig.promptTemplate
        .replace('{curtainStyleName}', curtainStyleName)
        .replace('{curtainStylePrompt}', curtainStylePrompt)
        .replace('{fabricDescription}', fabricDescription);

    const lines = [template];

    // 追加反向限制提示词
    if (aiPromptsConfig.negativePrompt) {
        lines.push(aiPromptsConfig.negativePrompt);
    }

    // 有用户备注时添加额外指引
    if (userNotes) {
        lines.push(`${aiPromptsConfig.userNotesPrefix}${userNotes}`);
    }

    // 有视角信息时添加视角说明
    if (cameraAngle) {
        lines.push(
            `视角参数: 水平 ${cameraAngle.x}°, 垂直 ${cameraAngle.y}°, 缩放 ${cameraAngle.z}°`
        );
    }

    return lines.join('\n');
}

// ==================== 生成效果图 API ====================

/** generateRendering 输入参数 */
export interface GenerateRenderingParams {
    /** 原始室内照片的 Base64 编码（不含 data URI 前缀） */
    originalImageBase64: string;
    /** 完整的 Prompt 文本（通常由 buildPrompt 生成） */
    prompt: string;
    /** 面料图片 Base64（可选，自定义面料时传入） */
    fabricImageBase64?: string | null;
}

/** generateRendering 返回结果 */
export interface GenerateRenderingResult {
    /** 生成的效果图 Base64 编码（不含 data URI 前缀） */
    imageBase64: string;
    /** MIME 类型 */
    mimeType: string;
    /** 消耗的 token 数量（用于审计） */
    totalTokens?: number;
}

/**
 * 调用 Gemini API 生成窗帘效果图
 *
 * @param params 生成参数
 * @returns 效果图 Base64 及元数据
 * @throws {Error} 当 GEMINI_API_KEY 未配置时抛出
 */
export async function generateRendering(
    params: GenerateRenderingParams
): Promise<GenerateRenderingResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY 未配置，请在 .env.local 中设置');
    }

    const { originalImageBase64, prompt, fabricImageBase64 } = params;

    const ai = new GoogleGenAI({
        apiKey,
        // 支持国内反代/中转：配置 GEMINI_BASE_URL 即可绕过 GFW
        ...(process.env.GEMINI_BASE_URL ? { httpOptions: { baseUrl: process.env.GEMINI_BASE_URL } } : {}),
    });

    // 构建多模态内容部分（图像 + 文本）
    const contents: {
        inlineData?: { data: string; mimeType: string };
        text?: string;
    }[] = [
            // 主图：原始室内照片
            {
                inlineData: {
                    data: originalImageBase64,
                    mimeType: 'image/jpeg',
                },
            },
            // 可选：面料参考图
            ...(fabricImageBase64
                ? [
                    {
                        inlineData: {
                            data: fabricImageBase64,
                            mimeType: 'image/jpeg',
                        },
                    },
                ]
                : []),
            // Prompt 文本
            { text: prompt },
        ];

    // 调用 Gemini 图像生成（模型和参数从 JSON 配置读取）
    const response = await ai.models.generateContent({
        model: aiPromptsConfig.modelConfig.model,
        contents: [{ role: 'user', parts: contents }],
        config: {
            responseModalities: aiPromptsConfig.modelConfig.responseModalities as ('IMAGE' | 'TEXT')[],
            // 注入 System Prompt（相公可在 config/ai-prompts.json 中修改系统指令）
            systemInstruction: aiPromptsConfig.systemPrompt,
        },
    });

    // 提取生成的图片
    const candidates = response.candidates ?? [];
    for (const candidate of candidates) {
        for (const part of candidate.content?.parts ?? []) {
            if (part.inlineData) {
                return {
                    imageBase64: part.inlineData.data ?? '',
                    mimeType: part.inlineData.mimeType ?? 'image/png',
                    totalTokens: response.usageMetadata?.totalTokenCount ?? undefined,
                };
            }
        }
    }

    throw new Error('Gemini API 未返回图像内容，请检查 Prompt 或 API 配置');
}
