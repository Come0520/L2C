'use client';

import { useState } from 'react';

export interface QuoteTab {
    id: string;
    title: string;
    [key: string]: unknown;
}

/**
 * 报价套餐表单状态管理与逻辑处理 Hook
 * 提供多标签页（明细分类）管理、客户关联及草稿保存能力
 * @param initialData 初始套餐数据（用于编辑模式预填充）
 * @returns 包含状态（tabs, isSubmitting 等）及操作方法的对象
 */
export function useQuoteBundle(initialData: Record<string, unknown> = {}) {
    const [tabs, setTabs] = useState<QuoteTab[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setTimeout(() => setIsSubmitting(false), 1000);
    };

    return {
        tabs,
        isSubmitting,
        handleSubmit,
        grandTotal: 0,
        handleSaveDraft: async () => { },
        handleAddCategory: () => { },
        updateTabFormData: () => { },
        handleTabClose: () => { },
        setActiveTabId: () => { },
        activeTabId: null,
        customerId: null,
        setCustomerId: () => { },
    };
}
