import { describe, expect, it } from 'vitest';
import { buildWatermarkText, doesImageNeedWatermark, type WatermarkConfig } from '../watermark';

/**
 * TDD 测试 — 水印工具纯函数
 * 注意：涉及 Sharp 图像处理的函数通过集成测试覆盖
 */
describe('buildWatermarkText', () => {
  it('有租户名称时应包含租户名', () => {
    const text = buildWatermarkText({ tenantName: 'L2C 窗帘工作室', isPaidPlan: false });
    expect(text).toContain('L2C 窗帘工作室');
  });

  it('免费版水印应包含"AI 试稿"字样', () => {
    const text = buildWatermarkText({ tenantName: '测试租户', isPaidPlan: false });
    expect(text).toContain('AI 试稿');
  });

  it('付费版水印应包含"© AI效果图"字样', () => {
    const text = buildWatermarkText({ tenantName: '专业工作室', isPaidPlan: true });
    expect(text).toContain('AI效果图');
  });

  it('付费版水印不应含"试稿"字样', () => {
    const text = buildWatermarkText({ tenantName: '专业工作室', isPaidPlan: true });
    expect(text).not.toContain('试稿');
  });
});

describe('doesImageNeedWatermark', () => {
  it('免费版图片始终需要水印', () => {
    expect(doesImageNeedWatermark({ isPaidPlan: false })).toBe(true);
  });

  it('付费版图片默认需要水印（版权保护）', () => {
    expect(doesImageNeedWatermark({ isPaidPlan: true })).toBe(true);
  });
});

describe('WatermarkConfig 类型结构', () => {
  it('应包含必要字段', () => {
    const config: WatermarkConfig = {
      tenantName: '我的工作室',
      isPaidPlan: false,
      position: 'bottom-right',
      opacity: 0.5,
      fontSize: 20,
    };
    expect(config.tenantName).toBeDefined();
    expect(config.isPaidPlan).toBeDefined();
    expect(config.position).toBe('bottom-right');
    expect(config.opacity).toBe(0.5);
    expect(config.fontSize).toBe(20);
  });
});
