import type { QuoteItem as BaseQuoteItem } from '@/shared/api/schema/quotes';

export interface QuoteItem extends BaseQuoteItem {
  children?: QuoteItem[];
}

// Any specific extra attributes can be defined here if needed
export type QuoteItemAttributes = Record<string, unknown>;

export interface CalcResult {
  finishedWidth?: number;
  finishedHeight?: number;
  cutWidth?: number;
  cutHeight?: number;
  stripCount?: number;
  fabricWidthCm?: number;
  quantity?: number;
  warning?: string;
}

export interface RoomData {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface WarningDialogState {
  open: boolean;
  title: string;
  message: string;
}

export interface ColumnVisibility {
  showImage: boolean;
  showWidth: boolean;
  showHeight: boolean;
  showFold: boolean;
  showProcessFee: boolean;
  showQuantity: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showAmount: boolean;
  showRemark: boolean;
  hideRoomColumn?: boolean;
}

export type ViewMode = 'category' | 'room';
