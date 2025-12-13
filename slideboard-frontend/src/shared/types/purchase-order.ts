import { Database } from './supabase';

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'shipped' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: Record<string, any>;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseNo: string;
  salesOrderId: string;
  salesOrderNo?: string;
  supplierId?: string;
  supplierName?: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  remarks?: string;
  items: PurchaseOrderItem[];
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderRequest {
  salesOrderId: string;
  supplierId?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    specifications?: Record<string, any>;
  }[];
  expectedDeliveryDate?: string;
  remarks?: string;
}

export interface UpdatePurchaseOrderRequest {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  remarks?: string;
}
