import { z } from 'zod';

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // 采购单号
  salesOrderId: string; // 关联的销售单ID
  salesOrderNo?: string; // 冗余显示
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  items: PurchaseOrderItem[];
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export const purchaseOrderSchema = z.object({
  salesOrderId: z.string().min(1, '请选择关联销售单'),
  supplierId: z.string().min(1, '请选择供应商'),
  supplierName: z.string().min(1, '供应商名称不能为空'),
  expectedDeliveryDate: z.string().optional(),
  remarks: z.string().optional(),
  items: z.array(z.object({
    productName: z.string().min(1, '产品名称不能为空'),
    quantity: z.number().min(1, '数量必须大于0'),
    unitPrice: z.number().min(0, '单价不能为负'),
    specifications: z.string().optional(),
    notes: z.string().optional()
  })).min(1, '至少包含一个采购项')
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
