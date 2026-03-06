import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/shared/lib/logger';
import { updateQuoteItem } from '@/features/quotes/actions/mutations';
import { QuoteItem as SharedQuoteItem } from '@/shared/api/schema/quotes';
import { QuoteItem as UIQuoteItem } from '@/features/quotes/components/quote-items-table/types';
import { AdvancedAttributes } from '@/features/quotes/constants/quote-item';

export interface UseQuoteItemAdvancedDrawerProps {
    item: UIQuoteItem | SharedQuoteItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function useQuoteItemAdvancedDrawer({
    item,
    open,
    onOpenChange,
    onSuccess,
}: UseQuoteItemAdvancedDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [attributes, setAttributes] = useState<AdvancedAttributes>({});
    const [processFee, setProcessFee] = useState<number>(0);
    const [foldRatio, setFoldRatio] = useState<number>(2);
    const [remark, setRemark] = useState('');

    useEffect(() => {
        if (item && open) {
            setAttributes((item.attributes as AdvancedAttributes) || {});
            setProcessFee(Number(item.processFee || 0));
            setFoldRatio(Number(item.foldRatio || 2));
            setRemark(item.remark || '');
        }
    }, [item, open]);

    const isCurtain = item ? ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(item.category) : false;
    const isWallpaper = item ? ['WALLPAPER', 'WALLCLOTH'].includes(item.category) : false;
    const isCustomPanel = attributes.formula === 'CUSTOM_PANEL';

    const updateAttribute = (key: keyof AdvancedAttributes, value: unknown) => {
        setAttributes((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updatePanel = (index: number, width: number) => {
        const newPanels = [...(attributes.customPanels || [])];
        newPanels[index] = { width };
        updateAttribute('customPanels', newPanels);
    };

    const addPanel = () => {
        const newPanels = [...(attributes.customPanels || []), { width: 0 }];
        updateAttribute('customPanels', newPanels);
    };

    const removePanel = (index: number) => {
        const newPanels = [...(attributes.customPanels || [])];
        newPanels.splice(index, 1);
        updateAttribute('customPanels', newPanels);
    };

    const handleSave = async () => {
        if (!item) return;

        setLoading(true);
        try {
            const processedAttributes: Record<
                string,
                string | number | boolean | null | { width: number }[]
            > = {};

            Object.keys(attributes).forEach((key) => {
                const val = attributes[key as keyof AdvancedAttributes];
                if (val !== undefined && val !== null) {
                    if (Array.isArray(val)) {
                        processedAttributes[key] = val;
                    } else {
                        processedAttributes[key] = String(val);
                    }
                }
            });

            // 将可能会产生 undefined 的字段转为 null 或数字
            if (attributes.fabricWidth) processedAttributes.fabricWidth = Number(attributes.fabricWidth);
            else processedAttributes.fabricWidth = null;

            if (attributes.sideLoss !== undefined && String(attributes.sideLoss) !== '') processedAttributes.sideLoss = Number(attributes.sideLoss);
            else processedAttributes.sideLoss = null;

            if (attributes.bottomLoss !== undefined && String(attributes.bottomLoss) !== '') processedAttributes.bottomLoss = Number(attributes.bottomLoss);
            else processedAttributes.bottomLoss = null;

            if (attributes.headerLoss !== undefined && String(attributes.headerLoss) !== '') processedAttributes.headerLoss = Number(attributes.headerLoss);
            else processedAttributes.headerLoss = null;

            if (attributes.rollLength) processedAttributes.rollLength = Number(attributes.rollLength);
            else processedAttributes.rollLength = null;

            if (attributes.patternRepeat !== undefined && String(attributes.patternRepeat) !== '') processedAttributes.patternRepeat = Number(attributes.patternRepeat);
            else processedAttributes.patternRepeat = null;

            Object.keys(processedAttributes).forEach((key) => {
                if (processedAttributes[key] === undefined) {
                    delete processedAttributes[key];
                }
            });

            await updateQuoteItem({
                id: item.id,
                processFee,
                foldRatio: isCurtain ? foldRatio : undefined,
                remark,
                attributes: processedAttributes as Record<
                    string,
                    string | number | boolean | (string | number | boolean | null)[] | null
                >,
            });
            toast.success('高级配置已保存');
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error('保存失败');
            logger.error(error);
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        attributes,
        processFee,
        setProcessFee,
        foldRatio,
        setFoldRatio,
        remark,
        setRemark,
        isCurtain,
        isWallpaper,
        isCustomPanel,
        updateAttribute,
        updatePanel,
        addPanel,
        removePanel,
        handleSave,
    };
}
