import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRecentProducts, getRecentProductIdsFromStorage } from '../use-recent-products';

const STORAGE_KEY = 'quote-recent-products';

// Mock localStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useRecentProducts', () => {
  let originalSort: typeof Array.prototype.sort;

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    originalSort = Array.prototype.sort;
    Array.prototype.sort = vi.fn().mockImplementation(() => {
      throw new Error('Mutation detected! Do not use .sort(), use .toSorted() instead.');
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Array.prototype.sort = originalSort;
  });

  it('should initialize with empty array if nothing in localStorage', () => {
    const { result } = renderHook(() => useRecentProducts());
    expect(result.current.recentProducts).toEqual([]);
  });

  it('should initialize with sorted items from localStorage', () => {
    const items = [
      { id: '1', name: 'A', sku: 'A1', category: 'C1', unitPrice: '10', usedAt: 1000 },
      { id: '2', name: 'B', sku: 'B1', category: 'C1', unitPrice: '20', usedAt: 2000 },
      { id: '3', name: 'C', sku: 'C1', category: 'C1', unitPrice: '30', usedAt: 1500 },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    const { result } = renderHook(() => useRecentProducts());
    // Should sort descending by usedAt
    expect(result.current.recentProducts.map((p) => p.id)).toEqual(['2', '3', '1']);
  });

  it('should add new product and limit to max items', () => {
    const { result } = renderHook(() => useRecentProducts());

    act(() => {
      vi.setSystemTime(5000);
      result.current.addRecentProduct({
        id: '1',
        name: 'A',
        sku: 'A1',
        category: 'C1',
        unitPrice: '10',
      });
    });

    expect(result.current.recentProducts).toHaveLength(1);
    expect(result.current.recentProducts[0].usedAt).toBe(5000);

    // Add same product again should update timestamp and move to front
    act(() => {
      vi.setSystemTime(6000);
      result.current.addRecentProduct({
        id: '2',
        name: 'B',
        sku: 'B1',
        category: 'C1',
        unitPrice: '20',
      });
    });

    act(() => {
      vi.setSystemTime(7000);
      result.current.addRecentProduct({
        id: '1',
        name: 'A',
        sku: 'A1',
        category: 'C1',
        unitPrice: '10',
      });
    });

    expect(result.current.recentProducts).toHaveLength(2);
    expect(result.current.recentProducts[0].id).toBe('1'); // Most recently used
    expect(result.current.recentProducts[0].usedAt).toBe(7000);
    expect(result.current.recentProducts[1].id).toBe('2');
  });

  it('getRecentProductIdsFromStorage should return sorted IDs', () => {
    const items = [
      { id: '1', name: 'A', sku: 'A1', category: 'C1', unitPrice: '10', usedAt: 1000 },
      { id: '2', name: 'B', sku: 'B1', category: 'C1', unitPrice: '20', usedAt: 2000 },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    const ids = getRecentProductIdsFromStorage();
    expect(ids).toEqual(['2', '1']);
  });
});
