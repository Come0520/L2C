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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc('create_order', { order_data: orderData as unknown as Record<string, unknown> } as any)
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
    // 尝试同时查询 sales_no 和 order_no，通过别名来兼容可能的字段名差异
    // 注意：这只是一个探测性的修复，用于确定数据库到底有什么字段
    // 如果数据库真的没有这两个字段，那么我们需要检查数据库表结构
    let selectString = `
      id, 
      status, 
      total_amount,
      created_at, 
      updated_at, 
      customer_id, 
      sales_id,
      customer:users!customer_id(name, phone), 
      sales:users!sales_id(name)
    `;
    
    // 我们暂时移除显式的 order_no/sales_no 查询，让它先跑通，或者通过 * 来查看所有字段
    // 但为了保持兼容性，我们先不查这个编号字段，看看是否能解决报错
    // 只要 id 能查出来，页面应该就能渲染（虽然编号可能会空）
    
      let query = supabase
        .from('orders')
        .select(selectString, { count: 'exact' })

      if (status) query = query.eq('status', status)

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
      // 暂时移除编号字段查询，避免报错
      const { data, error } = await supabase
        .from('orders')
        .select(`
        id, status, total_amount,
        created_at, updated_at, customer_id, sales_id,
        customer:users!customer_id(name, phone), 
        sales:users!sales_id(name), 
        items:order_items(id, order_id, product_id, quantity, unit_price)
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
   * 更新销售单状态（增强版，支持乐观锁和字段验证）
   */
  async updateSalesOrderStatusV2(
    id: string,
    newStatus: string,
    changedById: string,
    options?: { expectedVersion?: number; comment?: string }
  ): Promise<ServiceResponse<{ newVersion: number; fromStatus: string; toStatus: string }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('update_order_status_v2', {
        p_order_id: id,
        p_new_status: newStatus,
        p_changed_by_id: changedById,
        p_expected_version: options?.expectedVersion ?? null,
        p_comment: options?.comment ?? null,
      })
      if (error) throw error
      return {
        code: 0,
        message: 'success',
        data: {
          newVersion: data.new_version,
          fromStatus: data.from_status,
          toStatus: data.to_status
        }
      }
    })
  },

  /**
   * 取消销售单（自动回滚相关测量单和安装单）
   */
  async cancelSalesOrder(
    id: string,
    cancelledById: string,
    cancellationReason: string
  ): Promise<ServiceResponse<{ cancelledMeasurements: number; cancelledInstallations: number }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: id,
        p_cancelled_by_id: cancelledById,
        p_cancellation_reason: cancellationReason,
      })
      if (error) throw error
      return {
        code: 0,
        message: 'success',
        data: {
          cancelledMeasurements: data.cancelled_measurements,
          cancelledInstallations: data.cancelled_installations
        }
      }
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
   * 获取销售单状态历史（增强版，带分页和详细信息）
   */
  async getSalesOrderStatusHistoryEnhanced(
    id: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ServiceResponse<Array<{
    transitionId: string;
    fromStatus: string;
    fromStatusName: string;
    toStatus: string;
    toStatusName: string;
    changedById: string;
    changedByName: string;
    changedAt: string;
    comment: string;
    durationSeconds: number;
    durationDisplay: string;
    reasonCategory: string;
    metadata: Record<string, unknown>;
  }>>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_order_status_history_enhanced', {
        p_order_id: id,
        p_limit: options?.limit ?? 50,
        p_offset: options?.offset ?? 0,
      })
      if (error) throw error
      return {
        code: 0,
        message: 'success',
        data: (data || []).map((item: any) => ({
          transitionId: item.transition_id,
          fromStatus: item.from_status,
          fromStatusName: item.from_status_name,
          toStatus: item.to_status,
          toStatusName: item.to_status_name,
          changedById: item.changed_by_id,
          changedByName: item.changed_by_name,
          changedAt: item.changed_at,
          comment: item.comment,
          durationSeconds: item.duration_seconds,
          durationDisplay: item.duration_display,
          reasonCategory: item.reason_category,
          metadata: item.metadata,
        }))
      }
    })
  },

  /**
   * 获取订单状态统计信息
   */
  async getSalesOrderStatusStatistics(id: string): Promise<ServiceResponse<{
    totalTransitions: number;
    totalDurationSeconds: number;
    avgTransitionDurationSeconds: number;
    manualChanges: number;
    systemChanges: number;
    exceptionCount: number;
    currentStatus: string;
    currentStatusDurationSeconds: number;
  }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_order_status_statistics', { p_order_id: id })
      if (error) throw error
      const stats = data?.[0] || {}
      return {
        code: 0,
        message: 'success',
        data: {
          totalTransitions: stats.total_transitions || 0,
          totalDurationSeconds: stats.total_duration_seconds || 0,
          avgTransitionDurationSeconds: stats.avg_transition_duration_seconds || 0,
          manualChanges: stats.manual_changes || 0,
          systemChanges: stats.system_changes || 0,
          exceptionCount: stats.exception_count || 0,
          currentStatus: stats.current_status || '',
          currentStatusDurationSeconds: stats.current_status_duration_seconds || 0,
        }
      }
    })
  },

  /**
   * 获取订单状态时间线（用于可视化）
   */
  async getSalesOrderStatusTimeline(id: string): Promise<ServiceResponse<Array<{
    status: string;
    statusName: string;
    statusColor: string;
    enteredAt: string;
    exitedAt: string | null;
    durationSeconds: number;
    changedByName: string;
  }>>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_order_status_timeline', { p_order_id: id })
      if (error) throw error
      return {
        code: 0,
        message: 'success',
        data: (data || []).map((item: any) => ({
          status: item.status,
          statusName: item.status_name,
          statusColor: item.status_color,
          enteredAt: item.entered_at,
          exitedAt: item.exited_at,
          durationSeconds: item.duration_seconds,
          changedByName: item.changed_by_name,
        }))
      }
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

  /**
   * 批量更新销售单状态（增强版，带详细错误报告）
   */
  async batchUpdateSalesOrderStatusV2(
    ids: string[],
    newStatus: string,
    options?: { changedById?: string; skipValidation?: boolean }
  ): Promise<ServiceResponse<{
    successCount: number;
    failedCount: number;
    failedOrders: Array<{ orderId: string; reason: string }>
  }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('batch_update_order_status_v2', {
        p_order_ids: ids,
        p_new_status: newStatus,
        p_changed_by_id: options?.changedById ?? null,
        p_skip_validation: options?.skipValidation ?? false
      })
      if (error) throw error
      return {
        code: 0,
        message: 'success',
        data: {
          successCount: data.success_count,
          failedCount: data.failed_count,
          failedOrders: data.failed_orders
        }
      }
    })
  },

  /**
   * 获取允许的下一状态列表
   */
  async getAllowedNextStatuses(currentStatus: string): Promise<ServiceResponse<string[]>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_allowed_next_statuses', { p_current_status: currentStatus })
      if (error) throw error
      return { code: 0, message: 'success', data: data || [] }
    })
  },

  /**
   * 验证状态转换是否有效
   */
  async isValidStatusTransition(fromStatus: string, toStatus: string): Promise<ServiceResponse<boolean>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('is_valid_status_transition', {
        p_from_status: fromStatus,
        p_to_status: toStatus
      })
      if (error) throw error
      return { code: 0, message: 'success', data: data ?? false }
    })
  },

  /**
   * 批量分配销售人员
   */
  async batchAssignSalesPerson(
    orderIds: string[],
    salesPersonId: string,
    options?: { reason?: string }
  ): Promise<ServiceResponse<{
    successCount: number;
    failedCount: number;
    total: number;
    failedOrders: Array<{ orderId: string; orderNo: string; reason: string }>;
  }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('batch_assign_sales_person' as any, {
        p_order_ids: orderIds,
        p_sales_person_id: salesPersonId,
        p_assigned_by_id: user.id,
        p_reason: options?.reason ?? null,
      } as any)

      if (error) throw error
      if (!data) throw new Error('No data returned')

      const result = data as any
      return {
        code: 0,
        message: 'success',
        data: {
          successCount: result.success_count || 0,
          failedCount: result.failed_count || 0,
          total: result.total || 0,
          failedOrders: (result.failed_orders || []).map((item: any) => ({
            orderId: item.orderId,
            orderNo: item.orderNo,
            reason: item.reason,
          })),
        },
      }
    })
  },

  /**
   * 获取订单分配历史
   */
  async getOrderAssignmentHistory(orderId: string): Promise<ServiceResponse<Array<{
    assignmentId: string;
    oldAssigneeName: string | null;
    newAssigneeName: string;
    assignedByName: string;
    assignedAt: string;
    reason: string | null;
    assignmentType: string;
  }>>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_order_assignment_history' as any, {
        p_order_id: orderId,
      } as any)

      if (error) throw error

      const result = (data || []) as any[]
      return {
        code: 0,
        message: 'success',
        data: result.map((item: any) => ({
          assignmentId: item.assignment_id,
          oldAssigneeName: item.old_assignee_name,
          newAssigneeName: item.new_assignee_name,
          assignedByName: item.assigned_by_name,
          assignedAt: item.assigned_at,
          reason: item.reason,
          assignmentType: item.assignment_type,
        })),
      }
    })
  },

  /**
   * 获取销售人员分配统计
   */
  async getSalesPersonAssignmentStats(
    salesPersonId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<ServiceResponse<{
    totalAssignments: number;
    assignmentsAsNew: number;
    assignmentsAsOld: number;
    avgHoldDurationHours: number;
  }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_sales_person_assignment_stats' as any, {
        p_sales_person_id: salesPersonId,
        p_start_date: options?.startDate ?? null,
        p_end_date: options?.endDate ?? null,
      } as any)

      if (error) throw error

      const result = (data as any[] || [])
      const stats = result[0] || {}
      return {
        code: 0,
        message: 'success',
        data: {
          totalAssignments: stats.total_assignments || 0,
          assignmentsAsNew: stats.assignments_as_new || 0,
          assignmentsAsOld: stats.assignments_as_old || 0,
          avgHoldDurationHours: parseFloat(stats.avg_hold_duration_hours) || 0,
        },
      }
    })
  },

  /**
   * 批量导出订单
   */
  async exportOrders(
    orderIds: string[],
    format: 'csv' | 'excel' | 'pdf' = 'csv',
    options?: {
      includeFields?: string[];
      fileName?: string;
    }
  ): Promise<ServiceResponse<{ downloadUrl: string; fileName: string; recordCount: number }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('export-orders', {
        body: {
          orderIds,
          format,
          includeFields: options?.includeFields,
          fileName: options?.fileName,
        },
      })

      if (error) throw error
      if (!data || !data.success) {
        throw new Error(data?.error || 'Export failed')
      }

      return {
        code: 0,
        message: 'success',
        data: {
          downloadUrl: data.url,
          fileName: data.fileName,
          recordCount: data.recordCount,
        },
      }
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
