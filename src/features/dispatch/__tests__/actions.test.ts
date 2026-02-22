/**
 * Dispatch 模块测试
 * dispatch 模块只有纯逻辑工具库（scoring.ts），无 server action
 * 测试覆盖：评分算法逻辑正确性
 */
import { describe, it, expect } from 'vitest';
import { calculateWorkerScore } from '../smart-match/lib/scoring';

describe('Dispatch 模块 - 工人评分算法', () => {
    const baseWorker = {
        id: 'worker-1',
        skills: ['CURTAIN'],
        activeTaskCount: 0,
        avgRating: 5,
    };

    it('技能完全匹配应获得高分', () => {
        const score = calculateWorkerScore(baseWorker, { category: 'CURTAIN_FABRIC' });
        // 技能 50 + 空闲 30 + 评分满分 20 = 100
        expect(score).toBe(100);
    });

    it('技能不匹配应返回 0 分', () => {
        const worker = { ...baseWorker, skills: ['WALLCLOTH'] };
        const score = calculateWorkerScore(worker, { category: 'CURTAIN_FABRIC' });
        expect(score).toBe(0);
    });

    it('高负载应降低得分', () => {
        const busyWorker = { ...baseWorker, activeTaskCount: 4 };
        const score = calculateWorkerScore(busyWorker, { category: 'CURTAIN_FABRIC' });
        // 技能 50 + 忙碌 10 + 评分 20 = 80
        expect(score).toBe(80);
    });

    it('过载应扣分', () => {
        const overloadedWorker = { ...baseWorker, activeTaskCount: 6 };
        const score = calculateWorkerScore(overloadedWorker, { category: 'CURTAIN_FABRIC' });
        // 技能 50 + 爆单 -10 + 评分 20 = 60
        expect(score).toBe(60);
    });

    it('无评分应给中间分', () => {
        const noRatingWorker = { ...baseWorker, avgRating: undefined };
        const score = calculateWorkerScore(noRatingWorker, { category: 'CURTAIN_FABRIC' });
        // 技能 50 + 空闲 30 + 默认 10 = 90
        expect(score).toBe(90);
    });

    it('全能工应略低于专业工', () => {
        const allSkillWorker = { ...baseWorker, skills: ['ALL'] };
        const specialistScore = calculateWorkerScore(baseWorker, { category: 'CURTAIN_FABRIC' });
        const allScore = calculateWorkerScore(allSkillWorker, { category: 'CURTAIN_FABRIC' });
        expect(allScore).toBeLessThan(specialistScore);
    });

    it('得分应限制在 0-100 范围内', () => {
        const score = calculateWorkerScore(baseWorker, { category: 'CURTAIN_TRACK' });
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });
});
