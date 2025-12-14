'use client';

import { useEffect, useState } from 'react';

const SEARCH_HISTORY_KEY = 'lead_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * 搜索历史管理 Hook
 * 
 * 功能：
 * - 从 LocalStorage 加载历史记录
 * - 添加新的搜索记录（去重并限制数量）
 * - 清除历史记录
 * - 删除单条历史记录
 * 
 * @example
 * ```tsx
 * const { history, addToHistory, clearHistory, removeFromHistory } = useSearchHistory();
 * 
 * // 用户搜索时
 * const handleSearch = (term: string) => {
 *   addToHistory(term);
 *   // 执行搜索...
 * };
 * ```
 */
export function useSearchHistory() {
    const [history, setHistory] = useState<string[]>([]);

    // 从 LocalStorage 加载历史记录
    useEffect(() => {
        try {
            const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setHistory(parsed);
                }
            }
        } catch (error) {
            console.error('Failed to load search history:', error);
        }
    }, []);

    // 添加到历史记录
    const addToHistory = (term: string) => {
        if (!term || term.trim().length === 0) return;

        const trimmedTerm = term.trim();

        // 去重并将新项放到最前面
        const newHistory = [
            trimmedTerm,
            ...history.filter(h => h !== trimmedTerm)
        ].slice(0, MAX_HISTORY_ITEMS);

        setHistory(newHistory);

        try {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Failed to save search history:', error);
        }
    };

    // 清除所有历史记录
    const clearHistory = () => {
        setHistory([]);
        try {
            localStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (error) {
            console.error('Failed to clear search history:', error);
        }
    };

    // 删除单条历史记录
    const removeFromHistory = (term: string) => {
        const newHistory = history.filter(h => h !== term);
        setHistory(newHistory);

        try {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Failed to update search history:', error);
        }
    };

    return {
        history,
        addToHistory,
        clearHistory,
        removeFromHistory,
    };
}
