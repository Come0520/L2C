import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildPrompt, generateRendering, CURTAIN_STYLE_PROMPT_MAP } from '../gemini-client';

/**
 * TDD 测试 — Gemini API 客户端
 * 重点测试纯函数 buildPrompt 的行为，generateRendering 使用 mock
 */
describe('buildPrompt', () => {
    it('应包含款式描述', () => {
        const prompt = buildPrompt({
            curtainStyleName: '轨道双开帘',
            curtainStylePrompt: '轨道双开帘，左右各一幅，自然悬垂',
            fabricDescription: '米白色棉麻',
            userNotes: null,
            cameraAngle: null,
        });
        expect(prompt).toContain('轨道双开帘');
        expect(prompt).toContain('轨道双开帘，左右各一幅，自然悬垂');
    });

    it('应包含面料描述', () => {
        const prompt = buildPrompt({
            curtainStyleName: '罗马帘',
            curtainStylePrompt: '罗马帘，折叠提升式',
            fabricDescription: '蓝色雪尼尔提花',
            userNotes: null,
            cameraAngle: null,
        });
        expect(prompt).toContain('蓝色雪尼尔提花');
    });

    it('有用户备注时应将其包含进 Prompt', () => {
        const prompt = buildPrompt({
            curtainStyleName: '卷帘',
            curtainStylePrompt: '防晒遮光卷帘',
            fabricDescription: '灰色遮光',
            userNotes: '打褶密一点，要全遮光',
            cameraAngle: null,
        });
        expect(prompt).toContain('打褶密一点，要全遮光');
    });

    it('没有用户备注时 Prompt 不应含 null 或 undefined 字符串', () => {
        const prompt = buildPrompt({
            curtainStyleName: '百叶帘',
            curtainStylePrompt: '铝合金百叶帘',
            fabricDescription: '白色铝合金',
            userNotes: null,
            cameraAngle: null,
        });
        expect(prompt).not.toContain('null');
        expect(prompt).not.toContain('undefined');
    });

    it('有 cameraAngle 时应包含视角说明', () => {
        const prompt = buildPrompt({
            curtainStyleName: '轨道帘',
            curtainStylePrompt: '轨道单开帘',
            fabricDescription: '白色棉',
            userNotes: null,
            cameraAngle: { x: 10, y: 20, z: 0 },
        });
        expect(prompt).toContain('视角');
    });
});

describe('CURTAIN_STYLE_PROMPT_MAP', () => {
    it('应至少包含 8 款预设款式', () => {
        expect(Object.keys(CURTAIN_STYLE_PROMPT_MAP).length).toBeGreaterThanOrEqual(8);
    });

    it('每款风格应有 name 和 prompt 字段', () => {
        for (const [, style] of Object.entries(CURTAIN_STYLE_PROMPT_MAP)) {
            expect(style).toHaveProperty('name');
            expect(style).toHaveProperty('prompt');
            expect(typeof style.name).toBe('string');
            expect(typeof style.prompt).toBe('string');
        }
    });
});

describe('generateRendering', () => {
    beforeEach(() => {
        vi.stubEnv('GEMINI_API_KEY', 'test-key-placeholder');
    });

    it('API Key 未配置时应抛出错误', async () => {
        vi.unstubAllEnvs();
        await expect(
            generateRendering({
                originalImageBase64: 'fake-base64',
                prompt: '测试 Prompt',
            })
        ).rejects.toThrow('GEMINI_API_KEY');
    });
});
