'use client';

import { useState } from 'react';

export function useQuoteBundle(initialData: any = {}) {
    const [tabs, setTabs] = useState<any[]>([]);
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
        handleSaveDraft: async () => {},
        handleAddCategory: () => {},
        updateTabFormData: () => {},
        handleTabClose: () => {},
        setActiveTabId: () => {},
        activeTabId: null,
        customerId: null,
        setCustomerId: () => {},
    };
}
