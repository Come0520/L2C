import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductForm } from '../use-product-form';
import { type ProductFormValues } from '../../schema';

// Mock next-auth to avoid "Cannot find module 'next/server'" error in jsdom
vi.mock('next-auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'test-user', role: 'ADMIN' } }),
}));

// Mock the APIs
vi.mock('@/features/supply-chain/actions/supplier-actions', () => ({
  getSuppliers: vi
    .fn()
    .mockResolvedValue({ data: { data: [{ id: 'sup1', name: 'Test Supplier' }] } }),
}));

vi.mock('../actions', () => ({
  getAttributeTemplate: vi.fn().mockResolvedValue({
    data: {
      templateSchema: [
        { key: 'testAttr', label: 'Test Attribute', type: 'STRING', required: false },
      ],
    },
  }),
}));

describe('useProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultValues: Partial<ProductFormValues> = {
    category: 'CURTAIN',
    productType: 'FINISHED',
    lossRate: 0,
    processingCost: 0,
    purchasePrice: 100,
    retailPrice: 200,
  };

  it('应该正确初始化状态并计算价格', () => {
    const { result } = renderHook(() => useProductForm({ initialData: defaultValues }));

    expect(result.current.form.getValues('category')).toBe('CURTAIN');
    expect(result.current.isCurtain).toBe(true);
    expect(result.current.hasWidthSpec).toBe(true);

    // 计算逻辑测试：totalCost = 100 * (1 + 0) + 0 + 0 = 100
    expect(result.current.totalCost).toBe(100);
    // grossProfit = 200 - 100 = 100
    expect(result.current.grossProfit).toBe(100);
    // grossMargin = (100 / 200) * 100 = 50
    expect(result.current.grossMargin).toBe(50);
  });

  it('切换到窗帘面料时，应该自动设置为原材料采购', () => {
    const { result } = renderHook(() => useProductForm({}));

    act(() => {
      result.current.handleCategoryTabChange('CURTAIN_FABRIC');
    });

    expect(result.current.form.getValues('category')).toBe('CURTAIN_FABRIC');
    expect(result.current.form.getValues('productType')).toBe('CUSTOM');
    expect(result.current.isCurtainFabric).toBe(true);
  });

  it('应该支持添加和移除纹样', () => {
    const { result } = renderHook(() => useProductForm({}));

    act(() => {
      result.current.addPattern('条纹');
    });

    expect(result.current.currentPatterns).toContain('条纹');

    act(() => {
      result.current.removePattern('条纹');
    });

    expect(result.current.currentPatterns).not.toContain('条纹');
  });

  it('应该支持添加和移除风格', () => {
    const { result } = renderHook(() => useProductForm({}));

    act(() => {
      result.current.addStyle('现代简约');
    });

    expect(result.current.currentStyles).toContain('现代简约');

    act(() => {
      result.current.removeStyle('现代简约');
    });

    expect(result.current.currentStyles).not.toContain('现代简约');
  });
});
