import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessoryLinkageService } from '../services/accessory-linkage.service';
import { db } from '@/shared/api/db';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            products: {
                findFirst: vi.fn(),
            }
        }
    }
}));

describe('配件联动服务 (Accessory Linkage Service)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('窗帘主材联动 (Curtain linkage - Track & Service & Accessory)', async () => {
        vi.mocked(db.query.products.findFirst).mockResolvedValue({
            id: 'mock-product',
            name: '默认轨道',
            retailPrice: '50.00'
        } as any);

        const recommendations = await AccessoryLinkageService.getRecommendedAccessories({
            category: 'CURTAIN',
            width: 200,
            height: 250,
            foldRatio: 2.0
        }, 'tenant-1');

        // rule for curtain returns 3 items: SERVICE, CURTAIN_TRACK, CURTAIN_ACCESSORY
        expect(recommendations).toHaveLength(3);

        // Check FINISHED_WIDTH logic: 200 * 2.0 / 100 = 4m
        const trackRec = recommendations.find(r => r.category === 'CURTAIN_TRACK');
        expect(trackRec).toBeDefined();
        expect(trackRec?.quantity).toBe(4);
        expect(trackRec?.unitPrice).toBe(50);
    });

    it('墙纸主材联动 (Wallpaper linkage - Glue & Service proportional)', async () => {
        vi.mocked(db.query.products.findFirst).mockResolvedValue(null); // mock no default product found

        const recommendations = await AccessoryLinkageService.getRecommendedAccessories({
            category: 'WALLPAPER',
            width: 300,
            height: 250,
            quantity: 10 // 10 rolls
        }, 'tenant-1');

        // rule returns 2 items: WALLCLOTH_ACCESSORY (glue), SERVICE
        expect(recommendations).toHaveLength(2);

        // Glue proportional 0.2: 10 * 0.2 = 2
        const glueRec = recommendations.find(r => r.category === 'WALLCLOTH_ACCESSORY');
        expect(glueRec?.quantity).toBe(2);

        // Service proportional 1.0: 10 * 1.0 = 10
        const serviceRec = recommendations.find(r => r.category === 'SERVICE');
        expect(serviceRec?.quantity).toBe(10);

        // Name fallback
        expect(glueRec?.productName).toBe('默认WALLCLOTH_ACCESSORY');
    });

    it('没有对应规则的分类返回空 (Empty for no rules)', async () => {
        const recommendations = await AccessoryLinkageService.getRecommendedAccessories({
            category: 'OTHER_CAT',
            width: 100,
            height: 100
        }, 'tenant-1');

        expect(recommendations).toHaveLength(0);
    });
});
