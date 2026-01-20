import { describe, it, expect } from 'vitest';
import { CurtainStrategy } from '../curtain-strategy';
import { WallpaperStrategy } from '../wallpaper-strategy';

describe('Comprehensive Calculation Engine Verification', () => {

    describe('Curtain Strategy Edge Cases', () => {
        const strategy = new CurtainStrategy();

        it('定高模式：高度刚好达到临界点 (fabric=280, cutHeight=280) - 不应报警', () => {
            const result = strategy.calculate({
                measuredWidth: 300,
                measuredHeight: 250, // 250 + 20(wrapped) + 10(bottom) = 280
                fabricWidth: 2.8,
                fabricType: 'FIXED_HEIGHT',
                unitPrice: 100
            });
            expect(result.details?.cutHeight).toBe(280);
            expect(result.details?.warning).toBeUndefined();
        });

        it('定高模式：高度略微超过临界点 (diff <= 13cm) - 应提示让渡帘头', () => {
            const result = strategy.calculate({
                measuredWidth: 300,
                measuredHeight: 255, // 255 + 20 + 10 = 285. diff = 5.
                fabricWidth: 2.8,
                fabricType: 'FIXED_HEIGHT',
                unitPrice: 100
            });
            expect(result.details?.warning).toContain('建议让渡帘头');
        });

        it('定宽模式：极宽窗户 (12米) - 应正确计算幅数', () => {
            const result = strategy.calculate({
                measuredWidth: 1200,
                measuredHeight: 250,
                foldRatio: 2.0, // 2400cm finished
                fabricWidth: 1.4, // 140cm
                fabricType: 'FIXED_WIDTH',
                unitPrice: 100
            });
            // cutWidth = 2400 + 10(double) = 2410
            // N = ceil(2410 / 140) = 18 strips
            expect(result.details.stripCount).toBe(18);
        });
    });

    describe('Wallpaper Strategy Edge Cases', () => {
        const strategy = new WallpaperStrategy();

        it('墙纸对花逻辑：花距极大 (64cm) 导致每卷可切条数减少', () => {
            const result = strategy.calculate({
                width: 530, // 5.3m -> 约 10 条
                height: 240,
                fabricWidth: 0.53,
                rollLength: 10,
                calcType: 'WALLPAPER',
                patternRepeat: 64, // 每次对花浪费较多
                unitPrice: 100
            });
            // cutHeight = 240 + 10(default) = 250
            // effectiveHeight = ceil(250/64)*64 = 4*64 = 256cm
            // strips_per_roll = floor(1000 / 256) = 3条
            // total_strips = ceil((530+20)/53) = 11条
            // rolls = ceil(11/3) = 4卷
            expect(result.usage).toBe(4);
            expect(result.details?.effectiveHeightCm).toBe(256);
        });

        it('墙纸逻辑：高度正好是 2.5m (10m 卷理应切 4 条，但考虑 cutLoss 只能切 3 条)', () => {
            const result = strategy.calculate({
                width: 139, // (139 + 20 widthLoss) / 53 = 3 strips
                height: 245,
                fabricWidth: 0.53,
                rollLength: 10,
                cutLoss: 10,
                calcType: 'WALLPAPER',
                unitPrice: 100
            });
            // cutHeight = 245 + 10 = 255.
            // strips_per_roll = floor(1000 / 255) = 3条.
            // rolls = ceil(3 / 3) = 1卷.
            expect(result.usage).toBe(1);
        });
    });
});
