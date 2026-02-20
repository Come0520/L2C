import { describe, it, expect } from 'vitest';
import { getDefaultDashboardConfig } from '../utils';

describe('getDefaultDashboardConfig', () => {
    it.each([
        ['SALES', 5],
        ['MANAGER', 8],
        ['ADMIN', 8],
        ['DISPATCHER', 3],
        ['FINANCE', 4],
        ['ANY_OTHER', 1],
    ])('角色 %s 应该返回 %d 个默认 Widget', (role, count) => {
        const config = getDefaultDashboardConfig(role);
        expect(config.widgets).toHaveLength(count);
        expect(config.version).toBe(1);
        expect(config.columns).toBe(4);
    });

    it('所有默认 Widget 应该包含必需的布局属性', () => {
        const config = getDefaultDashboardConfig('SALES');
        config.widgets.forEach(w => {
            expect(w.id).toBeDefined();
            expect(w.type).toBeDefined();
            expect(w.x).toBeGreaterThanOrEqual(0);
            expect(w.y).toBeGreaterThanOrEqual(0);
            expect(w.w).toBeGreaterThan(0);
            expect(w.h).toBeGreaterThan(0);
            expect(w.visible).toBe(true);
        });
    });

    it('ADMIN 和 MANAGER 应该共享相同的配置', () => {
        const adminConfig = getDefaultDashboardConfig('ADMIN');
        const managerConfig = getDefaultDashboardConfig('MANAGER');
        expect(adminConfig.widgets).toEqual(managerConfig.widgets);
    });
});
