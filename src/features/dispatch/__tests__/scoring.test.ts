/**
 * Dispatch 模块 - 评分算法详细测试
 * 覆盖：技能匹配、负载均衡、评分排名、综合排序
 */
import { describe, it, expect } from 'vitest';
import { calculateWorkerScore } from '../smart-match/lib/scoring';
import { matchWorkersForTask } from '../smart-match/lib/matching';

// ============================================================
// T1: 技能匹配测试
// ============================================================
describe('技能匹配评分', () => {
    it('精确技能匹配应得 50 分', () => {
        const worker = { id: 'w1', skills: ['CURTAIN'], activeTaskCount: 0, avgRating: undefined };
        const task = { category: 'CURTAIN_FABRIC' };
        const score = calculateWorkerScore(worker, task);
        // 50（技能）+ 30（空闲）+ 10（无评分默认）= 90
        expect(score).toBe(90);
    });

    it('全能工(ALL)技能应得 40 分（比专业工低 10）', () => {
        const specialist = { id: 'w1', skills: ['CURTAIN'], activeTaskCount: 0, avgRating: undefined };
        const allRounder = { id: 'w2', skills: ['ALL'], activeTaskCount: 0, avgRating: undefined };
        const task = { category: 'CURTAIN_FABRIC' };

        const specialistScore = calculateWorkerScore(specialist, task);
        const allRounderScore = calculateWorkerScore(allRounder, task);

        // 专业工技能得 50，全能工得 40，差 10 分
        expect(specialistScore - allRounderScore).toBe(10);
    });

    it('技能不匹配应直接返回 0', () => {
        const worker = { id: 'w1', skills: ['WALLCLOTH'], activeTaskCount: 0, avgRating: 5 };
        const task = { category: 'CURTAIN_FABRIC' };
        expect(calculateWorkerScore(worker, task)).toBe(0);
    });

    it('WALL 品类任务应匹配 WALLCLOTH 技能', () => {
        const worker = { id: 'w1', skills: ['WALLCLOTH'], activeTaskCount: 0, avgRating: undefined };
        const task = { category: 'WALL_FABRIC' };
        const score = calculateWorkerScore(worker, task);
        // 能匹配到 WALLCLOTH 技能，score > 0
        expect(score).toBeGreaterThan(0);
    });
});

// ============================================================
// T1: 负载均衡测试
// ============================================================
describe('负载均衡评分', () => {
    const baseWorker = { id: 'w1', skills: ['CURTAIN'], activeTaskCount: 0, avgRating: undefined };
    const baseTask = { category: 'CURTAIN_FABRIC' };

    it('0 任务（空闲）应得 30 分负载分', () => {
        const score = calculateWorkerScore({ ...baseWorker, activeTaskCount: 0 }, baseTask);
        // 50 + 30 + 10 = 90
        expect(score).toBe(90);
    });

    it('1-2 任务（正常）应得 20 分负载分', () => {
        const score1 = calculateWorkerScore({ ...baseWorker, activeTaskCount: 1 }, baseTask);
        const score2 = calculateWorkerScore({ ...baseWorker, activeTaskCount: 2 }, baseTask);
        // 50 + 20 + 10 = 80
        expect(score1).toBe(80);
        expect(score2).toBe(80);
    });

    it('3-4 任务（忙碌）应得 10 分负载分', () => {
        const score3 = calculateWorkerScore({ ...baseWorker, activeTaskCount: 3 }, baseTask);
        const score4 = calculateWorkerScore({ ...baseWorker, activeTaskCount: 4 }, baseTask);
        // 50 + 10 + 10 = 70
        expect(score3).toBe(70);
        expect(score4).toBe(70);
    });

    it('≥5 任务（过载）应扣 10 分', () => {
        const score5 = calculateWorkerScore({ ...baseWorker, activeTaskCount: 5 }, baseTask);
        const score10 = calculateWorkerScore({ ...baseWorker, activeTaskCount: 10 }, baseTask);
        // 50 + (-10) + 10 = 50
        expect(score5).toBe(50);
        expect(score10).toBe(50);
    });

    it('不同负载的得分应按预期递减', () => {
        const scores = [0, 1, 3, 5].map(count =>
            calculateWorkerScore({ ...baseWorker, activeTaskCount: count }, baseTask)
        );
        // 空闲 > 正常 > 忙碌 > 过载
        expect(scores[0]).toBeGreaterThan(scores[1]);
        expect(scores[1]).toBeGreaterThan(scores[2]);
        expect(scores[2]).toBeGreaterThan(scores[3]);
    });
});

// ============================================================
// T1: 评分排名测试
// ============================================================
describe('服务评分权重计算', () => {
    const baseWorker = { id: 'w1', skills: ['CURTAIN'], activeTaskCount: 0 };
    const baseTask = { category: 'CURTAIN_FABRIC' };

    it('5 分评价应得满分服务分 20', () => {
        const score = calculateWorkerScore({ ...baseWorker, avgRating: 5 }, baseTask);
        // 50 + 30 + 20 = 100
        expect(score).toBe(100);
    });

    it('4 分评价应按比例计算（16 分服务分）', () => {
        const score = calculateWorkerScore({ ...baseWorker, avgRating: 4 }, baseTask);
        // 50 + 30 + 16 = 96
        expect(score).toBe(96);
    });

    it('3 分评价应得 12 分服务分', () => {
        const score = calculateWorkerScore({ ...baseWorker, avgRating: 3 }, baseTask);
        // 50 + 30 + 12 = 92
        expect(score).toBe(92);
    });

    it('无评价应给予默认中间分 10', () => {
        const score = calculateWorkerScore({ ...baseWorker, avgRating: undefined }, baseTask);
        // 50 + 30 + 10 = 90
        expect(score).toBe(90);
    });

    it('评分更高的工人总分应更高', () => {
        const highRated = calculateWorkerScore({ ...baseWorker, avgRating: 5 }, baseTask);
        const lowRated = calculateWorkerScore({ ...baseWorker, avgRating: 2 }, baseTask);
        expect(highRated).toBeGreaterThan(lowRated);
    });
});

// ============================================================
// T1: 综合排序测试
// ============================================================
describe('综合评分排序', () => {
    const task = { category: 'CURTAIN_FABRIC' };

    it('满分工人应排在首位', () => {
        const workers = [
            { id: 'w1', skills: ['CURTAIN'], activeTaskCount: 2, avgRating: 3 },
            { id: 'w2', skills: ['CURTAIN'], activeTaskCount: 0, avgRating: 5 }, // 最优
            { id: 'w3', skills: ['CURTAIN'], activeTaskCount: 4, avgRating: 4 },
        ];

        const ranked = workers
            .map(w => ({ ...w, score: calculateWorkerScore(w, task) }))
            .sort((a, b) => b.score - a.score);

        expect(ranked[0].id).toBe('w2');
    });

    it('技能不匹配的工人不应出现在有效候选中', () => {
        const workers = [
            { id: 'w1', skills: ['WALLCLOTH'], activeTaskCount: 0, avgRating: 5 }, // 不匹配
            { id: 'w2', skills: ['CURTAIN'], activeTaskCount: 3, avgRating: 3 },   // 匹配
        ];

        const validWorkers = workers.filter(w => calculateWorkerScore(w, task) > 0);
        expect(validWorkers).toHaveLength(1);
        expect(validWorkers[0].id).toBe('w2');
    });

    it('calculateWorkerScore 返回值应在 0-100 区间', () => {
        const extremeWorkers = [
            { id: 'w1', skills: ['CURTAIN'], activeTaskCount: 100, avgRating: 0.1 },
            { id: 'w2', skills: ['CURTAIN'], activeTaskCount: 0, avgRating: 5 },
        ];

        extremeWorkers.forEach(w => {
            const score = calculateWorkerScore(w, task);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });
});

// ============================================================
// T2: 批量匹配函数测试
// ============================================================
describe('批量匹配 matchWorkersForTask', () => {
    const task = { category: 'CURTAIN_FABRIC', location: undefined, scheduledAt: undefined };
    const workers = [
        { id: 'w1', skills: ['CURTAIN'], activeTaskCount: 0, avgRating: 5 },
        { id: 'w2', skills: ['CURTAIN'], activeTaskCount: 3, avgRating: 4 },
        { id: 'w3', skills: ['WALLCLOTH'], activeTaskCount: 0, avgRating: 5 }, // 不匹配
        { id: 'w4', skills: ['ALL'], activeTaskCount: 1, avgRating: 3 },
    ];

    it('应返回匹配工人的排序列表（分高者先）', () => {
        const result = matchWorkersForTask(task, workers);
        // 应过滤掉 w3（技能不匹配），剩余按分排序
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].score).toBeGreaterThanOrEqual(result[result.length - 1].score);
    });

    it('应过滤掉技能不匹配的工人', () => {
        const result = matchWorkersForTask(task, workers);
        const ids = result.map(r => r.worker.id);
        expect(ids).not.toContain('w3');
    });

    it('空工人列表应返回空数组', () => {
        const result = matchWorkersForTask(task, []);
        expect(result).toEqual([]);
    });

    it('全部工人技能不匹配时返回空数组', () => {
        const unmatchedWorkers = [
            { id: 'w1', skills: ['WALLCLOTH'], activeTaskCount: 0, avgRating: 5 },
        ];
        const result = matchWorkersForTask(task, unmatchedWorkers);
        expect(result).toEqual([]);
    });

    it('无可用工人（传入空数组）时应妥善处理', () => {
        const result = matchWorkersForTask(task, []);
        expect(result).toEqual([]);
    });

    it('所有工人都处于严重超载（activeTaskCount >= 5）状态', () => {
        const overloadedWorkers = [
            { id: 'w1', skills: ['CURTAIN'], activeTaskCount: 6, avgRating: 5 },
            { id: 'w2', skills: ['CURTAIN'], activeTaskCount: 10, avgRating: 4 },
        ];
        const result = matchWorkersForTask(task, overloadedWorkers);

        // 尽管超载会被扣分，但基础技能分仍在，因此不会返回空，而是优先返回扣分后仍较高的候选人
        expect(result).toHaveLength(2);
        expect(result[0].worker.id).toBe('w1'); // 评分稍高
    });

    it('所有工人都存在时间冲突并且排除了冲突 (excludeConflicts=true)', () => {
        const conflictWorkers = [
            {
                id: 'w1',
                skills: ['CURTAIN'],
                activeTaskCount: 0,
                scheduledSlots: [{ start: '2024-01-01T10:00:00Z', end: '2024-01-01T12:00:00Z' }]
            },
        ];
        const conflictingTask = { ...task, scheduledAt: '2024-01-01T10:30:00Z', durationMinutes: 60 };

        // 默认 excludeConflicts = true
        const result = matchWorkersForTask(conflictingTask, conflictWorkers);
        expect(result).toEqual([]);
    });

    it('全能工即使负载很高，也能返回（尽管分数较低）', () => {
        const allSkillWorker = { id: 'w1', skills: ['ALL'], activeTaskCount: 8, avgRating: 5 };
        const specificSkillWorker = { id: 'w2', skills: ['CURTAIN'], activeTaskCount: 0, avgRating: 5 };

        const result = matchWorkersForTask(task, [allSkillWorker, specificSkillWorker]);

        expect(result).toHaveLength(2);
        expect(result[0].worker.id).toBe('w2'); // 专业技能且不超载优先
        expect(result[1].worker.id).toBe('w1'); // 全能工超载分数更低
    });
});
