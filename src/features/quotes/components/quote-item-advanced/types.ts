import { UseQuoteItemAdvancedDrawerProps } from '@/features/quotes/hooks/use-quote-item-advanced-drawer';
import { AdvancedAttributes } from '@/features/quotes/constants/quote-item';

export interface QuoteItemAdvancedSectionProps {
    attributes: AdvancedAttributes;
    updateAttribute: (key: keyof AdvancedAttributes, value: unknown) => void;
    // 以下是针对某些特定段落额外需要的属性
    processFee?: number;
    setProcessFee?: (val: number) => void;
    remark?: string;
    setRemark?: (val: string) => void;
    foldRatio?: number;
    setFoldRatio?: (val: number) => void;
    itemWidth?: number;
    customPanels?: { width: number }[];
    updatePanel?: (index: number, width: number) => void;
    addPanel?: () => void;
    removePanel?: (index: number) => void;
    openingStyle?: string;
}
