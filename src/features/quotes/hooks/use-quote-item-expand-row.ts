import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/shared/lib/logger';
import { updateQuoteItem } from '@/features/quotes/actions/mutations';
import { AdvancedAttributes } from '@/features/quotes/constants/quote-item';

export interface UseQuoteItemExpandRowProps {
    itemId: string;
    category: string;
    attributes?: AdvancedAttributes;
    foldRatio?: number;
    processFee?: number;
    remark?: string;
    onSave?: () => void;
}

export function useQuoteItemExpandRow({
    itemId,
    category,
    attributes = {},
    foldRatio = 2,
    remark = '',
    onSave,
}: UseQuoteItemExpandRowProps) {
    const [editedAttrs, setEditedAttrs] = useState<AdvancedAttributes>(attributes);
    const [editedFoldRatio, setEditedFoldRatio] = useState(foldRatio);
    const [editedRemark, setEditedRemark] = useState(remark);

    const isCurtain = ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(category);
    const isCustomPanel = editedAttrs.openingStyle === 'CUSTOM';

    const updateAttr = useCallback((key: string, value: unknown) => {
        setEditedAttrs((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleAutoSave = async (
        updates: Partial<{ attrs: AdvancedAttributes; foldRatio: number; remark: string }> = {}
    ) => {
        const nextAttrs = updates.attrs ?? editedAttrs;
        const nextFoldRatio = updates.foldRatio ?? editedFoldRatio;
        const nextRemark = updates.remark ?? editedRemark;

        try {
            const mergedAttrs = {
                ...nextAttrs,
                fabricWidth: nextAttrs.fabricWidth ? Number(nextAttrs.fabricWidth) : undefined,
                sideLoss: nextAttrs.sideLoss !== undefined ? Number(nextAttrs.sideLoss) : undefined,
                bottomLoss: nextAttrs.bottomLoss !== undefined ? Number(nextAttrs.bottomLoss) : undefined,
                headerLoss: nextAttrs.headerLoss !== undefined ? Number(nextAttrs.headerLoss) : undefined,
                groundClearance:
                    nextAttrs.groundClearance !== undefined ? Number(nextAttrs.groundClearance) : undefined,
            };

            // Strip undefined values
            const cleanAttrs = Object.fromEntries(
                Object.entries(mergedAttrs).filter(([_, v]) => v !== undefined)
            );

            const res = await updateQuoteItem({
                id: itemId,
                foldRatio: isCurtain ? nextFoldRatio : undefined,
                remark: nextRemark || undefined,
                attributes: cleanAttrs as Record<string, unknown>,
            });

            if (res?.error) {
                toast.error('自动保存失败: 参数有误');
                logger.error('Auto save validation failed:', res.error);
                return;
            }
            onSave?.();
        } catch (error) {
            toast.error('自动保存失败');
            logger.error('Auto save failed:', error);
        }
    };

    const updateAttrAndSave = (key: string, value: unknown) => {
        const nextAttrs = { ...editedAttrs, [key]: value };
        setEditedAttrs(nextAttrs);
        handleAutoSave({ attrs: nextAttrs });
    };

    const updateOpeningStyleAndSave = (v: string) => {
        const nextAttrs = { ...editedAttrs, openingStyle: v };
        if (
            v === 'CUSTOM' &&
            (!editedAttrs.customPanels ||
                !Array.isArray(editedAttrs.customPanels) ||
                (editedAttrs.customPanels as { width: number }[]).length === 0)
        ) {
            nextAttrs.customPanels = [{ width: 150 }, { width: 150 }];
        }
        setEditedAttrs(nextAttrs);
        handleAutoSave({ attrs: nextAttrs });
    };

    const customPanels = Array.isArray(editedAttrs.customPanels)
        ? (editedAttrs.customPanels as { width: number }[])
        : [{ width: 0 }, { width: 0 }];

    const updatePanel = (index: number, width: number) => {
        const newPanels = [...customPanels];
        newPanels[index] = { width };
        updateAttr('customPanels', newPanels);
    };

    const addPanel = () => {
        const newPanels = [...customPanels, { width: 0 }];
        updateAttr('customPanels', newPanels);
        handleAutoSave({ attrs: { ...editedAttrs, customPanels: newPanels } });
    };

    const removePanel = (index: number) => {
        if (customPanels.length <= 1) return;
        const newPanels = customPanels.filter((_, i) => i !== index);
        updateAttr('customPanels', newPanels);
        handleAutoSave({ attrs: { ...editedAttrs, customPanels: newPanels } });
    };

    return {
        isCurtain,
        isCustomPanel,
        editedAttrs,
        editedFoldRatio,
        editedRemark,
        setEditedFoldRatio,
        setEditedRemark,
        updateAttr,
        updateAttrAndSave,
        handleAutoSave,
        updateOpeningStyleAndSave,
        customPanels,
        updatePanel,
        addPanel,
        removePanel,
    };
}

export type UseQuoteItemExpandRowReturn = ReturnType<typeof useQuoteItemExpandRow>;
