import { withErrorHandler } from '@/lib/api/error-handler';
import { supabase } from '@/lib/supabase/client';
import { PurchaseOrder, CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest } from '@/shared/types/purchase-order';
import { Database } from '@/types/supabase';

type PurchaseOrderRow = Database['public']['Tables']['purchase_orders']['Row'];
type PurchaseOrderItemRow = Database['public']['Tables']['purchase_order_items']['Row'];

interface PurchaseOrderWithRelations extends PurchaseOrderRow {
    sales_order?: { sales_no: string } | null;
    supplier?: { name: string } | null;
    items?: PurchaseOrderItemRow[];
    created_by_user?: { name: string } | null;
}

export const purchaseOrderService = {
  /**
   * Get purchase orders list
   */
  async getPurchaseOrders(filters?: { salesOrderId?: string; supplierId?: string; status?: string }) {
    return withErrorHandler(async () => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          sales_order:sales_orders(sales_no),
          supplier:suppliers(name),
          items:purchase_order_items(*),
          created_by_user:users(name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.salesOrderId) {
        query = query.eq('sales_order_id', filters.salesOrderId);
      }
      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => this.mapToPurchaseOrder(item as unknown as PurchaseOrderWithRelations));
    });
  },

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(id: string) {
    return withErrorHandler(async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          sales_order:sales_orders(sales_no),
          supplier:suppliers(name),
          items:purchase_order_items(*),
          created_by_user:users(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.mapToPurchaseOrder(data as unknown as PurchaseOrderWithRelations);
    });
  },

  /**
   * Create purchase order
   */
  async createPurchaseOrder(data: CreatePurchaseOrderRequest) {
    return withErrorHandler(async () => {
      // 1. Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      // 2. Generate PO Number (Simple logic, ideally should be DB function or more robust)
      const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // 3. Insert Purchase Order
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          purchase_no: poNumber,
          sales_order_id: data.salesOrderId,
          supplier_id: data.supplierId,
          total_amount: totalAmount,
          status: 'draft',
          expected_delivery_date: data.expectedDeliveryDate,
          remarks: data.remarks,
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        } as any)
        .select()
        .single();

      if (poError) throw poError;

      // 4. Insert Items
      const itemsToInsert = data.items.map(item => ({
        purchase_order_id: po.id,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
        specifications: item.specifications as any
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert as any);

      if (itemsError) throw itemsError;

      return this.getPurchaseOrderById(po.id);
    });
  },
  
  /**
   * Update purchase order status
   */
  async updateStatus(id: string, status: string) {
      return withErrorHandler(async () => {
        const { error } = await supabase
            .from('purchase_orders')
            .update({ status, updated_at: new Date().toISOString() } as any)
            .eq('id', id);
        
        if (error) throw error;
      });
  },

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderRequest) {
      return withErrorHandler(async () => {
          const updateData: any = { updated_at: new Date().toISOString() };
          if (data.supplierId) updateData.supplier_id = data.supplierId;
          if (data.status) updateData.status = data.status;
          if (data.expectedDeliveryDate) updateData.expected_delivery_date = data.expectedDeliveryDate;
          if (data.actualDeliveryDate) updateData.actual_delivery_date = data.actualDeliveryDate;
          if (data.remarks) updateData.remarks = data.remarks;

          const { error } = await supabase
            .from('purchase_orders')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
          return this.getPurchaseOrderById(id);
      });
  },

  // Helper to map DB result to Frontend Type
  mapToPurchaseOrder(dbRecord: PurchaseOrderWithRelations): PurchaseOrder {
      return {
          id: dbRecord.id,
          purchaseNo: dbRecord.purchase_no,
          salesOrderId: dbRecord.sales_order_id,
          salesOrderNo: dbRecord.sales_order?.sales_no,
          supplierId: dbRecord.supplier_id || undefined,
          supplierName: dbRecord.supplier?.name,
          totalAmount: dbRecord.total_amount,
          status: dbRecord.status as any,
          expectedDeliveryDate: dbRecord.expected_delivery_date || undefined,
          actualDeliveryDate: dbRecord.actual_delivery_date || undefined,
          remarks: dbRecord.remarks || undefined,
          items: (dbRecord.items || []).map(item => ({
              id: item.id,
              purchaseOrderId: item.purchase_order_id,
              productName: item.product_name,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price,
              specifications: (item.specifications as any) || {},
              createdAt: item.created_at
          })),
          createdBy: dbRecord.created_by,
          createdByName: dbRecord.created_by_user?.name || undefined,
          createdAt: dbRecord.created_at,
          updatedAt: dbRecord.updated_at
      };
  }
};
