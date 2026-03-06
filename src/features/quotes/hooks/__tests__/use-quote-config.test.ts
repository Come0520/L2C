import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuoteConfig } from '../use-quote-config';
import { updateGlobalQuoteConfig, toggleQuoteMode, updateUserPlan } from '@/features/quotes/actions/config-actions';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    }),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

vi.mock('@/features/quotes/actions/config-actions', () => ({
    updateGlobalQuoteConfig: vi.fn(),
    toggleQuoteMode: vi.fn(),
    updateUserPlan: vi.fn(),
}));

describe('useQuoteConfig hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该初始化默认值', () => {
        const { result } = renderHook(() => useQuoteConfig());
        expect(result.current.mode).toBe('simple');
        expect(result.current.selectedFields).toEqual([]);
        expect(result.current.defaultPlan).toBe('COMFORT');
    });

    it('应该能够切换模式并保存', async () => {
        const { result } = renderHook(() => useQuoteConfig());

        act(() => {
            result.current.setMode('advanced');
        });

        expect(result.current.mode).toBe('advanced');

        const onSuccess = vi.fn();
        await act(async () => {
            await result.current.handleSave(onSuccess);
        });

        expect(toggleQuoteMode).toHaveBeenCalledWith({ mode: 'advanced' });
        expect(updateGlobalQuoteConfig).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('配置已保存');
        expect(onSuccess).toHaveBeenCalled();
    });

    it('应该能够切换字段显隐', () => {
        const { result } = renderHook(() => useQuoteConfig());

        act(() => {
            result.current.handleFieldToggle('field1');
        });
        expect(result.current.selectedFields).toContain('field1');

        act(() => {
            result.current.handleFieldToggle('field1');
        });
        expect(result.current.selectedFields).not.toContain('field1');
    });

    it('应该能够开启和剔除 BOM 组件', () => {
        const { result } = renderHook(() => useQuoteConfig());

        expect(result.current.isComponentEnabled('curtain', 'fabric')).toBe(false);

        act(() => {
            result.current.toggleComponent('curtain', 'fabric', 'MULTIPLY');
        });

        expect(result.current.isComponentEnabled('curtain', 'fabric')).toBe(true);
        expect(result.current.bomTemplates).toHaveLength(1);
        expect(result.current.bomTemplates[0]).toMatchObject({
            mainCategory: 'curtain',
            targetCategory: 'fabric',
            calcLogic: 'MULTIPLY'
        });

        act(() => {
            result.current.toggleComponent('curtain', 'fabric', 'MULTIPLY');
        });

        expect(result.current.isComponentEnabled('curtain', 'fabric')).toBe(false);
        expect(result.current.bomTemplates).toHaveLength(0);
    });
});
