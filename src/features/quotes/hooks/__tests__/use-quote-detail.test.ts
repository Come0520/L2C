import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuoteDetail } from '../use-quote-detail';

// =============================================
// 测试数据工厂函数
// =============================================

/**
 * 创建一条测试用报价明细
 */
function makeItem(overrides: {
  id: string;
  category: string;
  roomId?: string | null;
  parentId?: string | null;
  subtotal?: string | number | null;
}) {
  return {
    id: overrides.id,
    category: overrides.category,
    roomId: overrides.roomId ?? null,
    parentId: overrides.parentId ?? null,
    subtotal: overrides.subtotal ?? '100',
    productName: `Product ${overrides.id}`,
    productId: `prod-${overrides.id}`,
    quantity: '1',
    unitPrice: '100',
    unit: 'piece',
    width: 1,
    height: 1,
    foldRatio: null,
    processFee: null,
    remark: null,
    attributes: null,
    productSku: `sku-${overrides.id}`,
  };
}

/**
 * 创建一个测试用空间（包含 items）
 */
function makeRoom(id: string, name: string, items: ReturnType<typeof makeItem>[]) {
  return { id, name, items };
}

// =============================================
// 测试合集
// =============================================

describe('useQuoteDetail - allRawItems 聚合', () => {
  it('应该合并顶级 items 与所有 room.items', () => {
    const topItem = makeItem({ id: 'top1', category: 'CURTAIN' });
    const roomItem = makeItem({ id: 'room1', category: 'WALLPAPER', roomId: 'r1' });

    const { result } = renderHook(() =>
      useQuoteDetail({
        quote: {
          id: 'q1',
          items: [topItem],
          rooms: [makeRoom('r1', '客厅', [roomItem])],
        } as Parameters<typeof useQuoteDetail>[0]['quote'],
      })
    );

    expect(result.current.allRawItems).toHaveLength(2);
    expect(result.current.allRawItems.map((i) => i.id)).toContain('top1');
    expect(result.current.allRawItems.map((i) => i.id)).toContain('room1');
  });

  it('当 items 和 rooms 均为空时，应该返回空数组', () => {
    const { result } = renderHook(() =>
      useQuoteDetail({
        quote: {
          id: 'q1',
          items: [],
          rooms: [],
        } as Parameters<typeof useQuoteDetail>[0]['quote'],
      })
    );
    expect(result.current.allRawItems).toEqual([]);
  });
});

describe('useQuoteDetail - categoryBreakdown 品类汇总', () => {
  it('应该按品类聚合数量和小计，且排除附件 (parentId != null)', () => {
    const mainCurtain = makeItem({ id: '1', category: 'CURTAIN', subtotal: '200' });
    const accessory = makeItem({
      id: '2',
      category: 'CURTAIN',
      parentId: 'parent1',
      subtotal: '50',
    });
    const wallpaper = makeItem({ id: '3', category: 'WALLPAPER', subtotal: '300' });

    const { result } = renderHook(() =>
      useQuoteDetail({
        quote: {
          id: 'q1',
          items: [mainCurtain, accessory, wallpaper],
          rooms: [],
        } as Parameters<typeof useQuoteDetail>[0]['quote'],
      })
    );

    const curtainBreakdown = result.current.categoryBreakdown.find((c) => c.category === 'CURTAIN');
    expect(curtainBreakdown?.itemCount).toBe(1);
    expect(curtainBreakdown?.subtotal).toBe(200);

    const wallpaperBreakdown = result.current.categoryBreakdown.find(
      (c) => c.category === 'WALLPAPER'
    );
    expect(wallpaperBreakdown?.itemCount).toBe(1);
    expect(wallpaperBreakdown?.subtotal).toBe(300);
  });
});

describe('useQuoteDetail - categoryViewItems 品类过滤', () => {
  it('应该只返回指定品类下的 items', () => {
    const curtain = makeItem({ id: '1', category: 'CURTAIN' });
    const wallpaper = makeItem({ id: '2', category: 'WALLPAPER' });

    const { result } = renderHook(() =>
      useQuoteDetail({
        quote: {
          id: 'q1',
          items: [curtain, wallpaper],
          rooms: [],
        } as Parameters<typeof useQuoteDetail>[0]['quote'],
        activeCategory: 'CURTAIN',
      })
    );

    expect(result.current.categoryViewItems).toHaveLength(1);
    expect(result.current.categoryViewItems[0].id).toBe('1');
  });

  it('当 activeCategory 为 SUMMARY 时，应该返回空数组', () => {
    const curtain = makeItem({ id: '1', category: 'CURTAIN' });

    const { result } = renderHook(() =>
      useQuoteDetail({
        quote: {
          id: 'q1',
          items: [curtain],
          rooms: [],
        } as Parameters<typeof useQuoteDetail>[0]['quote'],
        activeCategory: 'SUMMARY',
      })
    );

    expect(result.current.categoryViewItems).toEqual([]);
  });
});
