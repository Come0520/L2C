/**
 * Widget 注册表测试
 * 覆盖 Widget 注册表完整性、角色过滤、元数据一致性
 */
import { describe, it, expect } from 'vitest';
import { WIDGET_REGISTRY, getAvailableWidgets } from '../widgets/registry';
import type { WidgetType } from '../types';

describe('Widget 注册表', () => {

    // ---- 注册表完整性 ----

    describe('注册表完整性', () => {
        it('注册表应包含至少 10 个 Widget', () => {
            const entries = Object.entries(WIDGET_REGISTRY);
            expect(entries.length).toBeGreaterThanOrEqual(10);
        });

        it('每个 Widget 类型 key 应与 meta.type 一致', () => {
            for (const [key, meta] of Object.entries(WIDGET_REGISTRY)) {
                if (meta) {
                    expect(meta.type).toBe(key);
                }
            }
        });

        it('每个 Widget 应有 title、description、icon', () => {
            for (const [, meta] of Object.entries(WIDGET_REGISTRY)) {
                if (meta) {
                    expect(meta.title).toBeTruthy();
                    expect(meta.description).toBeTruthy();
                    expect(meta.icon).toBeDefined();
                }
            }
        });

        it('每个 Widget 应有 permissions 数组且非空', () => {
            for (const [, meta] of Object.entries(WIDGET_REGISTRY)) {
                if (meta) {
                    expect(Array.isArray(meta.permissions)).toBe(true);
                    expect(meta.permissions.length).toBeGreaterThan(0);
                }
            }
        });

        it('每个 Widget 的 defaultSize 应有正数 w 和 h', () => {
            for (const [, meta] of Object.entries(WIDGET_REGISTRY)) {
                if (meta) {
                    expect(meta.defaultSize.w).toBeGreaterThan(0);
                    expect(meta.defaultSize.h).toBeGreaterThan(0);
                }
            }
        });
    });

    // ---- 角色过滤 ----

    describe('角色过滤 (getAvailableWidgets)', () => {
        it('ADMIN 应能看到所有 Widget', () => {
            const result = getAvailableWidgets('ADMIN');
            const allWidgets = Object.values(WIDGET_REGISTRY).filter(Boolean);
            expect(result.length).toBe(allWidgets.length);
        });

        it('SALES 角色应只能看到销售和通用 Widget', () => {
            const result = getAvailableWidgets('SALES');
            const salesTypes: WidgetType[] = [
                'sales-target', 'sales-leads', 'sales-conversion', 'sales-avg-order',
                'pending-approval',
            ];
            expect(result.length).toBe(salesTypes.length);
            result.forEach(w => {
                expect(salesTypes).toContain(w.type);
            });
        });

        it('FINANCE 角色应看到财务相关 Widget', () => {
            const result = getAvailableWidgets('FINANCE');
            const financeTypes: WidgetType[] = [
                'ar-summary', 'ap-summary', 'cash-flow',
                'cash-flow-forecast', 'ar-aging',
                'pending-approval',
            ];
            expect(result.length).toBe(financeTypes.length);
            result.forEach(w => {
                expect(financeTypes).toContain(w.type);
            });
        });

        it('DISPATCHER 角色应看到派单相关 Widget', () => {
            const result = getAvailableWidgets('DISPATCHER');
            const dispatcherTypes: WidgetType[] = [
                'pending-measure', 'pending-install', 'today-schedule',
                'pending-approval',
            ];
            expect(result.length).toBe(dispatcherTypes.length);
            result.forEach(w => {
                expect(dispatcherTypes).toContain(w.type);
            });
        });

        it('MANAGER 角色应看到管理层和部分其他 Widget', () => {
            const result = getAvailableWidgets('MANAGER');
            // MANAGER 应该能看到很多 Widget，但不是全部
            expect(result.length).toBeGreaterThan(5);
            // 确保管理层专属都在
            const managerTypes: WidgetType[] = [
                'team-sales', 'team-target', 'team-leaderboard',
                'executive-summary', 'conversion-funnel',
            ];
            managerTypes.forEach(type => {
                expect(result.some(w => w.type === type)).toBe(true);
            });
        });

        it('无效角色不应看到任何 Widget', () => {
            const result = getAvailableWidgets('GUEST');
            expect(result.length).toBe(0);
        });

        it('空字符串角色不应看到任何 Widget', () => {
            const result = getAvailableWidgets('');
            expect(result.length).toBe(0);
        });
    });
});
