'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/shared/lib/logger';

const STORAGE_KEY = 'quote-recent-products';
const MAX_RECENT_ITEMS = 10;

export interface RecentProduct {
    id: string;
    name: string;
    sku: string;
    category: string;
    unitPrice: string | null;
    usedAt: number; // 时间戳
}

/**
 * 最近使用商品的本地存储 Hook
 * 用于记录和获取用户最近添加过的商品，优化搜索体验
 */
export function useRecentProducts() {
    // 使用初始化函数模式从 localStorage 加载，避免 useEffect 中的 setState
    const [recentProducts, setRecentProducts] = useState<RecentProduct[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as RecentProduct[];
                return parsed.sort((a, b) => b.usedAt - a.usedAt);
            }
        } catch {
            // 忽略 SSR 或解析错误
        }
        return [];
    });

    /**
     * 记录使用的商品
     */
    const addRecentProduct = useCallback((product: Omit<RecentProduct, 'usedAt'>) => {
        setRecentProducts(prev => {
            // 移除已存在的相同商品
            const filtered = prev.filter(p => p.id !== product.id);

            // 添加到最前面
            const updated = [
                { ...product, usedAt: Date.now() },
                ...filtered
            ].slice(0, MAX_RECENT_ITEMS); // 限制数量

            // 保存到 localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (error) {
                logger.warn('无法保存最近使用商品:', error);
            }

            return updated;
        });
    }, []);

    /**
     * 清除所有记录
     */
    const clearRecentProducts = useCallback(() => {
        setRecentProducts([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            logger.warn('无法清除最近使用商品:', error);
        }
    }, []);

    /**
     * 获取最近使用的商品 ID 列表（用于排序）
     */
    const getRecentProductIds = useCallback(() => {
        return recentProducts.map(p => p.id);
    }, [recentProducts]);

    return {
        recentProducts,
        addRecentProduct,
        clearRecentProducts,
        getRecentProductIds,
    };
}

/**
 * 静态方法：直接从 localStorage 获取最近使用的商品 ID
 * 用于服务端数据排序
 */
export function getRecentProductIdsFromStorage(): string[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as RecentProduct[];
            return parsed
                .sort((a, b) => b.usedAt - a.usedAt)
                .map(p => p.id);
        }
    } catch {
        // 忽略错误
    }
    return [];
}
