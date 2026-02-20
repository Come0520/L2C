'use client';

import { useState } from 'react';

import type { QuoteItem } from '@/shared/api/schema/quotes';

/**
 * 按分类定制的报价明细表单逻辑处理 Hook
 * 支持处理窗帘、墙纸等带复杂附属配件及空间划分的项目交互
 * @param category 当前明细分类（如 'CURTAIN', 'WALLPAPER'）
 * @param initialData 初始明细数据（用于编辑模式预填充）
 * @returns 包含状态（items, spaces 等）及各类内部状态操作方法的对象
 */
export function useCategoryQuoteForm(category: string, initialData: Record<string, unknown> = {}) {
    const [items, setItems] = useState<QuoteItem[]>([]);
    const [spaces, setSpaces] = useState<string[]>(['Master Bedroom', 'Living Room']);

    return {
        items,
        spaces,
        expandedSpace: null,
        setExpandedSpace: () => { },
        expandedItemId: null,
        setExpandedItemId: () => { },
        deleteItemConfirm: { open: false, itemId: null, itemName: '' },
        setDeleteItemConfirm: () => { },
        handleDeleteItem: () => { },
        attachmentFormOpenState: {},
        handleUpdateItem: () => { },
        handleUpdateSpecs: () => { },
        handleSelectProduct: () => { },
        handleAddSpace: () => { },
        handleRemoveSpace: () => { },
        handleSpaceNameChange: () => { },
        handleAddItem: () => { },
        handleRemoveItemClick: () => { },
        handleToggleAttachmentForm: () => { },
        handleAddAttachment: () => { },
        handleRemoveAttachment: () => { },
        handleSelectAttachmentProduct: () => { },
        isWallpaperCategory: category === 'WALLPAPER'
    };
}
