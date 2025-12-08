import { withErrorHandler } from '@/lib/api/error-handler'
import { createClient } from '@/lib/supabase/client'
import { OrderFormData, CurtainItem, PackageDefinition } from '@/shared/types/order'
import { toDbFields, fromDbFields } from '@/utils/db-mapping'

/**
 * 销售单服务（客户端版本）
 * 用于Client Components和客户端代码
 */



// 服务返回类型定义
type ServiceResponse<T = null> = {
  code: number
  message: string
  data: T | null
}

type SalesOrderListResponse = ServiceResponse<{
  orders: OrderFormData[]
  total: number
  page: number
  pageSize: number
}>

type SalesOrderResponse = ServiceResponse<OrderFormData>
type OrderIdResponse = ServiceResponse<{ id: string }>
type OrderItemsResponse = ServiceResponse<CurtainItem[]>
type SalesOrderPackagesResponse = ServiceResponse<PackageDefinition[]>
type BatchUpdateResponse = ServiceResponse<{ updatedCount: number }>
type StatusHistoryResponse = ServiceResponse<unknown[]>

export const salesOrderService = {
  /**
   * 创建销售单
   */
  async createSalesOrder(orderData: OrderFormData): Promise<OrderIdResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      // OrderFormData is already camelCase, and toDbFields handles it.
      // But verify if `create_order` RPC expects snake_case keys inside the JSON object?
      // Assuming RPC handles parameter mapping or expects specific structure. 
      // If RPC expects `order_data` parameter which IS the json, we should ensure the JSON content matches what backend expects.
      // Given leads.client.ts success, we assume standard mapping.

      const { data, error } = await supabase.rpc('create_order', { order_data: orderData as unknown as Record<string, unknown> })
      if (error) throw error
      return { code: 0, message: 'success', data: { id: data } }
    })
  },

  /**
   * 获取销售单列表
   */
  async getSalesOrders(page: number = 1, pageSize: number = 10, status?: string, customerName?: string): Promise<SalesOrderListResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      let query = supabase
        .from('orders')
        .select(`
        id, sales_no, status, customer_name, customer_phone, project_address,
        designer, sales_person, create_time, expected_delivery_time,
        total_amount, subtotal_amount, discount_amount, tax_amount,
        created_at, updated_at, customer_id, sales_id,
        customer:users!customer_id(name, phone), sales:users!sales_id(name)
      `, { count: 'exact' })

      if (status) query = query.eq('status', status)
      if (customerName) query = query.ilike('customer_name', `%${customerName}%`)

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false })

      if (error) throw error

      const orders = (data || []).map(item => mapDbToSalesOrder(item))
      return { code: 0, message: 'success', data: { orders, total: count || 0, page, pageSize } }
    })
  },

  /**
   * 获取销售单详情
   */
  async getSalesOrderById(id: string): Promise<SalesOrderResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
        id, sales_no, status, customer_name, customer_phone, project_address,
        designer, sales_person, create_time, expected_delivery_time,
        total_amount, subtotal_amount, discount_amount, tax_amount,
        created_at, updated_at, customer_id, sales_id,
        customer:users!customer_id(name, phone), 
        sales:users!sales_id(name), 
        items:order_items(id, order_id, product_id, quantity, unit_price, 
          category, product_name, specifications, remarks)
      `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { code: 0, message: 'success', data: mapDbToSalesOrder(data) }
    })
  },

  /**
   * 更新销售单
   */
  async updateSalesOrder(id: string, orderData: Partial<OrderFormData> & { status?: string }, changedById?: string): Promise<OrderIdResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      if (orderData.status) {
        const { error } = await supabase.rpc('update_order_status', {
          p_order_id: id,
          p_new_status: orderData.status,
          p_changed_by_id: changedById ?? null,
        })
        if (error) throw error
        return { code: 0, message: 'success', data: { id } }
      }

      // Use toDbFields for content update
      const dbData = toDbFields(orderData, {
        customerName: 'customer_name',
        customerPhone: 'customer_phone',
        projectAddress: 'project_address',
        designer: 'designer',
        salesPerson: 'sales_person',
        expectedDeliveryTime: 'expected_delivery_time'
      })

      const { error } = await supabase
        .from('orders')
        .update({
          ...dbData,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id)

      if (error) throw error
      return { code: 0, message: 'success', data: { id } }
    })
  },

  /**
   * 删除销售单
   */
  async deleteSalesOrder(id: string): Promise<ServiceResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('delete_order', { p_order_id: id })
      if (error) throw error
      return { code: 0, message: 'success', data: null }
    })
  },

  /**
   * 获取销售单项
   */
  async getSalesOrderItems(id: string): Promise<OrderItemsResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', id)
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (data || []).map(item => fromDbFields(item) as any as CurtainItem)
      return { code: 0, message: 'success', data: items }
    })
  },

  /**
   * 获取销售单套餐
   */
  async getSalesOrderPackages(id: string): Promise<SalesOrderPackagesResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('sales_order_packages').select('*').eq('sales_order_id', id)
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const packages = (data || []).map(item => fromDbFields(item) as any as PackageDefinition)
      return { code: 0, message: 'success', data: packages }
    })
  },

  /**
   * 获取销售单详情 (Duplicate of getSalesOrderById? Keeping for compatibility)
   */
  async getSalesOrderDetails(id: string): Promise<SalesOrderResponse> {
    return this.getSalesOrderById(id)
  },

  /**
   * 获取销售单状态历史
   */
  async getSalesOrderStatusHistory(id: string): Promise<StatusHistoryResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_order_status_history', { p_order_id: id })
      if (error) throw error
      return { code: 0, message: 'success', data: data || [] }
    })
  },

  /**
   * 批量更新销售单状态
   */
  async batchUpdateSalesOrderStatus(ids: string[], newStatus: string): Promise<BatchUpdateResponse> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('batch_update_order_status', { p_order_ids: ids, p_new_status: newStatus })
      if (error) throw error
      return { code: 0, message: 'success', data: { updatedCount: data ?? 0 } }
    })
  },
}

// Helper: Map DB snake_case to CamelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbToSalesOrder(dbRecord: Record<string, unknown>): OrderFormData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = fromDbFields(dbRecord) as any as OrderFormData

  // Handle nested arrays/objects if necessary
  if (dbRecord.items && Array.isArray(dbRecord.items)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    base['items'] = dbRecord.items.map((item: Record<string, unknown>) => fromDbFields(item) as any as CurtainItem)
  }

  return base
}
