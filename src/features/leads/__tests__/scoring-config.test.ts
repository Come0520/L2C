import { describe, it, expect } from 'vitest';
import {
    calculateBudgetScore,
    getStarRating,
    getPriorityLabel,
    SOURCE_WEIGHTS,
    INTENTION_WEIGHTS
} from '../config/scoring-config';

describe('scoring-config', () => {
    describe('calculateBudgetScore', () => {
        it('应返回满分 35 分当预算 >= 50000', () => {
            expect(calculateBudgetScore(50000)).toBe(35);
            expect(calculateBudgetScore(100000)).toBe(35);
        });

        it('应返回 28 分当预算 20000-50000', () => {
            expect(calculateBudgetScore(20000)).toBe(28);
            expect(calculateBudgetScore(49999)).toBe(28);
        });

        it('应返回 20 分当预算 10000-20000', () => {
            expect(calculateBudgetScore(10000)).toBe(20);
            expect(calculateBudgetScore(19999)).toBe(20);
        });

        it('应返回 12 分当预算 5000-10000', () => {
            expect(calculateBudgetScore(5000)).toBe(12);
            expect(calculateBudgetScore(9999)).toBe(12);
        });

        it('应返回 5 分当预算 > 0', () => {
            expect(calculateBudgetScore(1)).toBe(5);
            expect(calculateBudgetScore(4999)).toBe(5);
        });

        it('应返回 0 分当预算 = 0', () => {
            expect(calculateBudgetScore(0)).toBe(0);
        });
    });

    describe('getStarRating', () => {
        it('应返回 5 星当分数 >= 80', () => {
            expect(getStarRating(80)).toBe(5);
            expect(getStarRating(100)).toBe(5);
        });

        it('应返回 4 星当分数 60-79', () => {
            expect(getStarRating(60)).toBe(4);
            expect(getStarRating(79)).toBe(4);
        });

        it('应返回 3 星当分数 40-59', () => {
            expect(getStarRating(40)).toBe(3);
            expect(getStarRating(59)).toBe(3);
        });

        it('应返回 2 星当分数 20-39', () => {
            expect(getStarRating(20)).toBe(2);
            expect(getStarRating(39)).toBe(2);
        });

        it('应返回 1 星当分数 < 20', () => {
            expect(getStarRating(0)).toBe(1);
            expect(getStarRating(19)).toBe(1);
        });
    });

    describe('getPriorityLabel', () => {
        it('应返回热门线索当分数 >= 70', () => {
            expect(getPriorityLabel(70)).toBe('热门线索');
            expect(getPriorityLabel(100)).toBe('热门线索');
        });

        it('应返回优质线索当分数 50-69', () => {
            expect(getPriorityLabel(50)).toBe('优质线索');
            expect(getPriorityLabel(69)).toBe('优质线索');
        });

        it('应返回普通线索当分数 30-49', () => {
            expect(getPriorityLabel(30)).toBe('普通线索');
            expect(getPriorityLabel(49)).toBe('普通线索');
        });

        it('应返回待培育当分数 < 30', () => {
            expect(getPriorityLabel(0)).toBe('待培育');
            expect(getPriorityLabel(29)).toBe('待培育');
        });
    });

    describe('权重配置', () => {
        it('来源权重应包含所有必要渠道', () => {
            expect(SOURCE_WEIGHTS.REFERRAL).toBe(30);
            expect(SOURCE_WEIGHTS.REPEAT).toBe(25);
            expect(SOURCE_WEIGHTS.OFFLINE_EVENT).toBe(20);
            expect(SOURCE_WEIGHTS.ONLINE_AD).toBe(15);
            expect(SOURCE_WEIGHTS.PHONE_INQUIRY).toBe(12);
            expect(SOURCE_WEIGHTS.WALK_IN).toBe(10);
            expect(SOURCE_WEIGHTS.OTHER).toBe(5);
        });

        it('意向度权重应包含所有级别', () => {
            expect(INTENTION_WEIGHTS.HIGH).toBe(35);
            expect(INTENTION_WEIGHTS.MEDIUM).toBe(20);
            expect(INTENTION_WEIGHTS.LOW).toBe(10);
        });
    });
});
