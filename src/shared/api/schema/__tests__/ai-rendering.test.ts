import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aiCurtainStyleTemplates, aiRenderings } from '../ai-rendering';

/**
 * TDD 测试 — AI 渲染 Schema 结构校验
 * 验证两张表的表名和关键字段是否正确定义
 */
describe('ai-rendering schema', () => {
  describe('aiRenderings 渲染记录表', () => {
    it('表名应为 ai_renderings', () => {
      expect(getTableName(aiRenderings)).toBe('ai_renderings');
    });

    it('应包含基础必要字段', () => {
      const columns = Object.keys(aiRenderings);
      expect(columns).toContain('id');
      expect(columns).toContain('tenantId');
      expect(columns).toContain('userId');
    });

    it('应包含面料相关字段', () => {
      const columns = Object.keys(aiRenderings);
      expect(columns).toContain('fabricSource');
      expect(columns).toContain('showroomProductId');
      expect(columns).toContain('customFabricUrl');
      expect(columns).toContain('curtainStyleId');
    });

    it('应包含出图参数字段', () => {
      const columns = Object.keys(aiRenderings);
      expect(columns).toContain('originalImageUrl');
      expect(columns).toContain('maskData');
      expect(columns).toContain('cameraAngle');
      expect(columns).toContain('outputMode');
    });

    it('应包含状态和结果字段', () => {
      const columns = Object.keys(aiRenderings);
      expect(columns).toContain('status');
      expect(columns).toContain('resultImageUrl');
      expect(columns).toContain('creditsUsed');
      expect(columns).toContain('aiPrompt');
    });

    it('应包含重试相关字段', () => {
      const columns = Object.keys(aiRenderings);
      expect(columns).toContain('parentRenderingId');
      expect(columns).toContain('retryCount');
      expect(columns).toContain('errorMessage');
    });

    it('应包含审计字段', () => {
      const columns = Object.keys(aiRenderings);
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
      expect(columns).toContain('createdBy');
      expect(columns).toContain('updatedBy');
    });
  });

  describe('aiCurtainStyleTemplates 款式模板表', () => {
    it('表名应为 ai_curtain_style_templates', () => {
      expect(getTableName(aiCurtainStyleTemplates)).toBe('ai_curtain_style_templates');
    });

    it('应包含基础必要字段', () => {
      const columns = Object.keys(aiCurtainStyleTemplates);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('category');
    });

    it('应包含图片和 AI Prompt 字段', () => {
      const columns = Object.keys(aiCurtainStyleTemplates);
      expect(columns).toContain('thumbnailUrl');
      expect(columns).toContain('referenceImageUrl');
      expect(columns).toContain('promptFragment');
    });

    it('应包含排序和启用状态字段', () => {
      const columns = Object.keys(aiCurtainStyleTemplates);
      expect(columns).toContain('sortOrder');
      expect(columns).toContain('isActive');
    });

    it('应包含审计字段', () => {
      const columns = Object.keys(aiCurtainStyleTemplates);
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
    });
  });
});
