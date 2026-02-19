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

export interface QuoteItemAttributes {
  calcResult?: CalcResult;
  _warnings?: string;
  productImage?: string;
  fabricWidth?: number;
  rollLength?: number;
  patternRepeat?: number;
  formula?: string;
  sideLoss?: number;
  bottomLoss?: number;
  headerLoss?: number;
  [key: string]: unknown;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  roomId: string | null;
  parentId: string | null;
  category: string;
  productId?: string | null;
  productSku?: string | null;
  productName?: string;
  roomName?: string | null;
  unitPrice: string | number;
  quantity: string | number;
  width: string | number | null;
  height: string | number | null;
  foldRatio?: string | number | null;
  processFee?: string | number | null;
  subtotal: string | number;
  remark?: string | null;
  unit?: string | null;
  attributes?: QuoteItemAttributes;
  children?: QuoteItem[];
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
}

export type ViewMode = 'category' | 'room';
