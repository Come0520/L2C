'use client';

import { useState } from 'react';

export function useCategoryQuoteForm(category: string, initialData: any = {}) {
    const [items, setItems] = useState<any[]>([]);
    const [spaces, setSpaces] = useState<string[]>(['Master Bedroom', 'Living Room']);

    return {
        items,
        spaces,
        expandedSpace: null,
        setExpandedSpace: () => {},
        expandedItemId: null,
        setExpandedItemId: () => {},
        deleteItemConfirm: { open: false, itemId: null, itemName: '' },
        setDeleteItemConfirm: () => {},
        handleDeleteItem: () => {},
        attachmentFormOpenState: {},
        handleUpdateItem: () => {},
        handleUpdateSpecs: () => {},
        handleSelectProduct: () => {},
        handleAddSpace: () => {},
        handleRemoveSpace: () => {},
        handleSpaceNameChange: () => {},
        handleAddItem: () => {},
        handleRemoveItemClick: () => {},
        handleToggleAttachmentForm: () => {},
        handleAddAttachment: () => {},
        handleRemoveAttachment: () => {},
        handleSelectAttachmentProduct: () => {},
        isWallpaperCategory: category === 'WALLPAPER'
    };
}
