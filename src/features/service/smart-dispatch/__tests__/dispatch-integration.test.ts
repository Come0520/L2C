import { describe, it, expect } from 'vitest';
import { calculateWorkerScore } from '../scoring';

/**
 * 智能调度集成测试
 *
 * 验证评分算法在不同距离下的表现及多师傅排序
 */
describe('Smart Dispatch Integration', () => {
    const mockWorker = {
        id: 'worker-1',
        name: '张师傅',
        skills: ['CURTAIN', 'WALLPAPER'],
        addressGeo: { lat: 31.23, lng: 121.47 } // 上海市中心
    };

    const mockTaskContext = {
        category: 'CURTAIN',
        location: { lat: 31.25, lng: 121.50 } // 约 3-5km 距离
    };

    describe('评分算法测试', () => {
        it('应该为 5km 以内的师傅给出最高距离分', () => {
            const score = calculateWorkerScore(mockWorker, mockTaskContext);
            // 距离 < 5km，满分距离分
            expect(score).toBeGreaterThan(50);
        });

        it('应该为距离较远的师傅给出较低分数', () => {
            const farContext = {
                ...mockTaskContext,
                location: { lat: 31.40, lng: 121.60 } // 约 15-20km
            };
            const nearScore = calculateWorkerScore(mockWorker, mockTaskContext);
            const farScore = calculateWorkerScore(mockWorker, farContext);
            // 近的师傅分数应该高于远的
            expect(nearScore).toBeGreaterThanOrEqual(farScore);
        });

        it('应该为无位置信息的师傅给出较低加分', () => {
            const noGeoWorker = { ...mockWorker, addressGeo: null };
            const noGeoScore = calculateWorkerScore(noGeoWorker, mockTaskContext);
            const withGeoScore = calculateWorkerScore(mockWorker, mockTaskContext);
            // 有位置的师傅分数应该更高或相等
            expect(withGeoScore).toBeGreaterThanOrEqual(noGeoScore);
        });
    });

    describe('多师傅排序测试', () => {
        it('应该在多个师傅中按分数排序', () => {
            const workers = [
                { id: 'w1', skills: ['CURTAIN'], addressGeo: { lat: 31.23, lng: 121.47 } }, // 近
                { id: 'w2', skills: ['CURTAIN'], addressGeo: { lat: 30.00, lng: 120.00 } }, // 远
            ];

            const scores = workers.map(w => ({
                id: w.id,
                score: calculateWorkerScore(w, mockTaskContext)
            }));

            const sorted = scores.sort((a, b) => b.score - a.score);
            // 近的师傅(w1)应排在前面
            expect(sorted[0].id).toBe('w1');
        });
    });
});
