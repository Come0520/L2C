/**
 * 水印处理工具
 *
 * 负责在 AI 生成的效果图上添加水印，保护版权并标识来源。
 * 免费版：半透明水印 + "AI 试稿"字样，防止商业盗用
 * 付费版：轻量品牌水印，保留著作权标识
 *
 * 图像处理依赖 Sharp（服务端 Node.js 环境，不在浏览器中运行）
 */

// ==================== 类型定义 ====================

/** 水印位置 */
export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

/** 水印配置 */
export interface WatermarkConfig {
  /** 租户名称，显示为品牌标识 */
  tenantName: string;
  /** 是否为付费套餐（影响水印样式） */
  isPaidPlan: boolean;
  /** 水印位置，默认右下角 */
  position?: WatermarkPosition;
  /** 透明度 0-1，免费版默认 0.4，付费版默认 0.2 */
  opacity?: number;
  /** 字体大小（像素），默认 24 */
  fontSize?: number;
}

/** addWatermark 输入参数 */
export interface AddWatermarkParams {
  /** 原始图片 Buffer（来自 Gemini 的返回结果） */
  imageBuffer: Buffer;
  /** 水印配置 */
  config: WatermarkConfig;
}

// ==================== 纯函数 ====================

/**
 * 构建水印文字内容（纯函数，无副作用）
 *
 * @param config 水印配置
 * @returns 水印显示文字
 */
export function buildWatermarkText(
  config: Pick<WatermarkConfig, 'tenantName' | 'isPaidPlan'>
): string {
  const { tenantName, isPaidPlan } = config;

  if (isPaidPlan) {
    return `© AI效果图 · ${tenantName}`;
  }

  return `AI 试稿 · ${tenantName} · 仅供参考`;
}

/**
 * 判断效果图是否需要添加水印
 * 当前策略：所有图片都加水印（免费版重，付费版轻）
 *
 * @param config 水印相关配置
 * @returns true 表示需要加水印
 */
export function doesImageNeedWatermark(config: Pick<WatermarkConfig, 'isPaidPlan'>): boolean {
  // 所有版本都需要水印（版权保护 + 品牌曝光）
  // Phase 3 可根据需求增加"无水印"Premium 选项
  void config.isPaidPlan;
  return true;
}

/**
 * 获取套餐对应的水印透明度
 *
 * @param isPaidPlan 是否付费套餐
 * @returns 透明度值（0-1）
 */
export function getWatermarkOpacity(isPaidPlan: boolean): number {
  return isPaidPlan ? 0.2 : 0.4;
}

// ==================== 图像处理（Sharp） ====================

/**
 * 使用 Sharp 在效果图上叠加 SVG 水印
 * 仅在服务端（Node.js）运行，不支持浏览器环境
 *
 * @param params 水印处理参数
 * @returns 添加水印后的图片 Buffer（JPEG 格式）
 */
export async function addWatermark(params: AddWatermarkParams): Promise<Buffer> {
  // 动态 import Sharp，避免影响客户端 bundle
  const sharp = await import('sharp').then((m) => m.default);

  const { imageBuffer, config } = params;
  const { tenantName, isPaidPlan, position = 'bottom-right', fontSize = 24 } = config;

  const opacity = config.opacity ?? getWatermarkOpacity(isPaidPlan);
  const watermarkText = buildWatermarkText({ tenantName, isPaidPlan });

  // 获取图片元数据以确定尺寸
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;

  // 计算水印位置偏移
  const padding = 20;
  const textWidth = watermarkText.length * (fontSize * 0.6);
  const textHeight = fontSize + 8;
  const positionMap: Record<WatermarkPosition, { x: number; y: number }> = {
    'top-left': { x: padding, y: padding + fontSize },
    'top-right': { x: width - textWidth - padding, y: padding + fontSize },
    'bottom-left': { x: padding, y: height - padding - textHeight },
    'bottom-right': { x: width - textWidth - padding, y: height - padding - textHeight },
    center: { x: (width - textWidth) / 2, y: (height + fontSize) / 2 },
  };
  const { x, y } = positionMap[position];

  // 构建 SVG 水印层
  const svgWatermark = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .watermark {
          font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
          font-size: ${fontSize}px;
          fill: white;
          fill-opacity: ${opacity};
          paint-order: stroke;
          stroke: rgba(0,0,0,${opacity * 0.5});
          stroke-width: 2px;
        }
      </style>
      <text class="watermark" x="${x}" y="${y}">${watermarkText}</text>
    </svg>
  `;

  // 叠加水印并输出 JPEG
  const result = await sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svgWatermark),
        blend: 'over',
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}
