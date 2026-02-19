/**
 * 墙纸/墙布计算策略单元测试
 * 基于 docs/报价单需求.md 第 10 节计算逻辑
 */

import { describe, it, expect } from 'vitest';
import { WallpaperStrategy, DEFAULT_WALLPAPER_CALC_SETTINGS } from '../wallpaper-strategy';

interface WallpaperCalcParams {
    width?: number;
    height?: number;
    fabricWidth?: number;
    unitPrice?: number;
    calcType?: string;
    rollLength?: number;
    widthLoss?: number;
    cutLoss?: number;
    patternRepeat?: number;
    wallSegments?: Array<{ width: number }>;
    heightLoss?: number;
}

describe('WallpaperStrategy', () => {
    const strategy = new WallpaperStrategy();

    describe('墙纸计算 (WALLPAPER - 卷数计算)', () => {
        it('应正确计算基础墙纸卷数 - 单墙面', () => {
            // 场景: 墙宽 300cm, 高 260cm, 墙纸规格 0.53m × 10m
            const params: WallpaperCalcParams = {
                width: 300, // cm
                height: 260, // cm
                fabricWidth: 0.53, // m
                unitPrice: 100,
                calcType: 'WALLPAPER',
                rollLength: 10, // m
                widthLoss: 20, // cm
                cutLoss: 10, // cm
            };
            const result = strategy.calculate(params);

            // 计算过程:
            // 1. 条数 = ceil((300 + 20) / 53) = ceil(6.04) = 7条
            // 2. 单条高度 = 260 + 10 = 270cm
            // 3. 每卷条数 = floor(1000 / 270) = 3条
            // 4. 卷数 = ceil(7 / 3) = 3卷
            expect(result.usage).toBe(3);
            expect(result.subtotal).toBe(300); // 3 × 100
        });

        it('应正确计算多墙段墙纸卷数', () => {
            // 需求文档示例: 墙段1=300cm, 墙段2=400cm, 墙段3=250cm
            // 墙纸 0.53m × 10m, 高度 260cm
            const params: WallpaperCalcParams = {
                width: 0, // 使用 wallSegments
                height: 260,
                fabricWidth: 0.53,
                unitPrice: 100,
                calcType: 'WALLPAPER',
                rollLength: 10,
                widthLoss: 20,
                cutLoss: 10,
                wallSegments: [
                    { width: 300 },
                    { width: 400 },
                    { width: 250 },
                ],
            };
            const result = strategy.calculate(params);

            // 计算过程:
            // 墙段1: ceil((300+20)/53) = 7条
            // 墙段2: ceil((400+20)/53) = 8条
            // 墙段3: ceil((250+20)/53) = 6条
            // 总条数 = 21条
            // 每卷条数 = floor(1000/270) = 3条
            // 卷数 = ceil(21/3) = 7卷
            expect(result.usage).toBe(7);
            expect(result.details.totalStrips).toBe(21);
        });

        it('应正确处理花距对花逻辑', () => {
            // 花距 32cm 的情况
            const params: WallpaperCalcParams = {
                width: 300,
                height: 260,
                fabricWidth: 0.53,
                unitPrice: 100,
                calcType: 'WALLPAPER',
                rollLength: 10,
                widthLoss: 20,
                cutLoss: 10,
                patternRepeat: 32, // 花距 32cm
            };
            const result = strategy.calculate(params);

            // 计算过程:
            // 基础高度 = 260 + 10 = 270cm
            // 对花后高度 = ceil(270/32) × 32 = 9 × 32 = 288cm
            // 每卷条数 = floor(1000/288) = 3条
            expect(result.details.effectiveHeightCm).toBe(288);
        });
    });

    describe('墙布计算 (WALLCLOTH - 面积计算)', () => {
        it('应正确计算墙布面积 - 单墙面', () => {
            const params: WallpaperCalcParams = {
                width: 300, // cm
                height: 260, // cm
                fabricWidth: 2.8, // m (定高)
                unitPrice: 50,
                calcType: 'WALLCLOTH',
                widthLoss: 20, // cm
            };
            const result = strategy.calculate({ ...params, heightLoss: 10 });

            // 计算过程:
            // 用料宽度 = (300 + 20) / 100 = 3.2m
            // 面积 = 3.2 × 2.8 = 8.96 m²（P1-02 修复后按面积计算）
            expect(result.usage).toBeCloseTo(8.96, 1);
            expect(result.subtotal).toBeCloseTo(448, 0); // 8.96 × 50
        });

        it('应正确计算多墙段墙布用量', () => {
            const params: WallpaperCalcParams = {
                width: 0,
                height: 260,
                fabricWidth: 2.8,
                unitPrice: 50,
                calcType: 'WALLCLOTH',
                widthLoss: 20,
                wallSegments: [
                    { width: 300 },
                    { width: 400 },
                    { width: 250 },
                ],
            };
            const result = strategy.calculate({ ...params, heightLoss: 10 });

            // 总宽度 = (300+20) + (400+20) + (250+20) = 1010cm = 10.1m
            // 面积 = 10.1 × 2.8 = 28.28 m²（P1-02 修复后按面积计算）
            expect(result.usage).toBeCloseTo(28.28, 1);
        });

        it('应在墙高超过幅宽时发出警告', () => {
            const params: WallpaperCalcParams = {
                width: 300,
                height: 300, // 超过幅宽 280cm
                fabricWidth: 2.8,
                unitPrice: 50,
                calcType: 'WALLCLOTH',
            };
            const result = strategy.calculate(params);

            expect(result.details?.warning).toBeDefined();
            // 实际警告消息是中文
            expect(result.details?.warning).toContain('高度不足');
        });
    });

    describe('默认配置', () => {
        it('应正确设置默认损耗参数', () => {
            expect(DEFAULT_WALLPAPER_CALC_SETTINGS.widthLoss).toBe(20);
            expect(DEFAULT_WALLPAPER_CALC_SETTINGS.heightLoss).toBe(10);
            expect(DEFAULT_WALLPAPER_CALC_SETTINGS.cutLoss).toBe(10);
            expect(DEFAULT_WALLPAPER_CALC_SETTINGS.rollWidth).toBe(0.53);
            expect(DEFAULT_WALLPAPER_CALC_SETTINGS.rollLength).toBe(10);
        });
    });
});
