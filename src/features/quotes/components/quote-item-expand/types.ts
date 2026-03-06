import { UseQuoteItemExpandRowReturn } from '@/features/quotes/hooks/use-quote-item-expand-row';

export interface ExpandRowSharedProps extends UseQuoteItemExpandRowReturn {
    readOnly?: boolean;
    extraCols: number;
    middleCols: number;
    onToggle: () => void;
}
