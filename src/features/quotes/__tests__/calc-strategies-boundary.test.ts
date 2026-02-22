import { describe, it, expect } from 'vitest';
import { CurtainStrategy } from '../calc-strategies/curtain-strategy';
import { WallpaperStrategy } from '../calc-strategies/wallpaper-strategy';
import { StandardProductStrategy } from '../calc-strategies/standard-product-strategy';
import { StrategyFactory } from '../calc-strategies/strategy-factory';

describe('calc-strategies 边界和异常测试 (Boundary & Exception Tests)', () => {
    describe('CurtainStrategy (窗帘策略)', () => {
        it('计算高度正常时无预警 (No warning on normal height)', () => {
            const strategy = new CurtainStrategy();
            const result = strategy.calculate({
                measuredWidth: 200,
                measuredHeight: 250, // 正常高度
                fabricWidth: 2.8, // 280cm
                fabricType: 'FIXED_HEIGHT',
                unitPrice: 100,
            });
            expect(result.details.warning).toBeUndefined();
            // 窗帘用量 = 200 * 2.0 (褶皱) + 10 (默认损耗) = 410 -> 4.1m
            expect(result.usage).toBeCloseTo(4.1);
            expect(result.subtotal).toBeCloseTo(410);
        });

        it('超高预警：建议让渡帘头 (Warning: Adjust header)', () => {
            const strategy = new CurtainStrategy();
            const result = strategy.calculate({
                measuredWidth: 200,
                measuredHeight: 265,
                headerType: 'WRAPPED',
                fabricWidth: 2.8,
                fabricType: 'FIXED_HEIGHT',
                unitPrice: 100,
            });
            expect(result.details.warning).toBe('超高预警：需让渡底边或拼接');
        });

        it('超高预警：让渡帘头工艺 (Warning: Limit 13cm)', () => {
            const strategy = new CurtainStrategy();
            const result = strategy.calculate({
                measuredWidth: 200,
                measuredHeight: 260,
                headerType: 'WRAPPED',
                fabricWidth: 2.8,
                fabricType: 'FIXED_HEIGHT',
                unitPrice: 100,
            });
            expect(result.details.warning).toBe('建议让渡帘头：改用贴布带工艺');
        });

        it('定宽工艺计算检验 (Fixed Width Algorithm)', () => {
            const strategy = new CurtainStrategy();
            const result = strategy.calculate({
                measuredWidth: 200,
                measuredHeight: 250,
                fabricWidth: 1.4, // 140cm 定宽
                fabricType: 'FIXED_WIDTH',
                unitPrice: 100,
                foldRatio: 2.0,
            });
            expect(result.details.stripCount).toBe(3);
            expect(result.usage).toBeCloseTo(8.4);
        });
    });

    describe('WallpaperStrategy (墙纸墙布策略)', () => {
        it('墙布计算包含额外对花损耗 (Wallcloth with match pattern loss)', () => {
            const strategy = new WallpaperStrategy();
            const result = strategy.calculate({
                width: 300,
                height: 250,
                fabricWidth: 2.8, // meter
                unitPrice: 100,
                calcType: 'WALLCLOTH'
            });
            expect(result.usage).toBeGreaterThan(0);
        });

        it('标准墙纸使用卷数计算核心逻辑 (Wallpaper Roll count)', () => {
            const strategy = new WallpaperStrategy();
            const result = strategy.calculate({
                width: 400,
                height: 250,
                fabricWidth: 0.53, // 53cm
                unitPrice: 100,
                calcType: 'WALLPAPER',
                rollLength: 10,
            });
            expect(result.usage).toBeGreaterThan(0); // usage is rolls
        });

        it('墙布超高异常预警 (Wallcloth Over-height exception warning)', () => {
            const strategy = new WallpaperStrategy();
            const result = strategy.calculate({
                width: 300,
                height: 350,
                fabricWidth: 2.8,
                unitPrice: 100,
                calcType: 'WALLCLOTH'
            });
            expect(result.details?.warning).toContain('墙布高度不足');
        });

        it('零元计算边界 (Zero Price or Dimension boundary)', () => {
            const strategy = new WallpaperStrategy();
            const result = strategy.calculate({
                width: 0,
                height: 0,
                fabricWidth: 2.8,
                unitPrice: 0,
                calcType: 'WALLCLOTH'
            });
            // Due to default losses (widthLoss=20), totalWidthM = 0.2m, area = 0.2 * 2.8 = 0.56m²
            expect(result.usage).toBe(0.56);
            expect(result.subtotal).toBe(0);
        });
    });

    describe('StandardProductStrategy (标品策略)', () => {
        it('正常数量与单价计算 (Normal calculation)', () => {
            const strategy = new StandardProductStrategy();
            const result = strategy.calculate({ quantity: 5, unitPrice: 20 });
            expect(result.usage).toBe(5);
            expect(result.subtotal).toBe(100);
        });

        it('数量缺省默认计算 (Missing quantity defaulting)', () => {
            const strategy = new StandardProductStrategy();
            const result = strategy.calculate({ unitPrice: 20 });
            expect(result.usage).toBe(0);
            expect(result.subtotal).toBe(0);
        });

        it('浮点数精度测试 (Floating point precision)', () => {
            const strategy = new StandardProductStrategy();
            const result = strategy.calculate({ quantity: 3, unitPrice: 0.33 });
            expect(result.subtotal).toBe(0.99);
        });
    });

    describe('StrategyFactory (策略工厂)', () => {
        it('返回 WALLPAPER 对应的 WallpaperStrategy', () => {
            const strategy = StrategyFactory.getStrategy('WALLPAPER');
            expect(strategy instanceof WallpaperStrategy).toBe(true);
        });

        it('返回 CURTAIN 对应的 CurtainStrategy', () => {
            const strategy = StrategyFactory.getStrategy('CURTAIN');
            expect(strategy instanceof CurtainStrategy).toBe(true);
        });

        it('默认异常类型返回 StandardProductStrategy', () => {
            const strategy = StrategyFactory.getStrategy('UNKNOWN_TYPE');
            expect(strategy instanceof StandardProductStrategy).toBe(true);
        });
    });
});
