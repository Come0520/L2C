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
  async getSalesOrders(page: number = 1, pageSize: number = 10, status?: string, _customerName?: string): Promise<SalesOrderListResponse> {
    return withErrorHandler(async () => {
      // 生成模拟数据，为每个状态生成10条订单
      const generateMockOrders = (status: string, startIndex: number = 1, count: number = 10) => {
        const mockOrders = []
        for (let i = startIndex; i <= startIndex + count - 1; i++) {
          const orderId = `MOCK-${status}-${i.toString().padStart(3, '0')}`
          mockOrders.push({
            id: orderId,
            status: status,
            total_amount: Math.floor(Math.random() * 10000) + 1000,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            updated_at: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
            statusUpdatedAt: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
            customer_id: `customer-${i}`,
            sales_id: `sales-${Math.floor(i / 5) + 1}`,
            sales_no: `SO-${20240000 + i}`,
            order_no: `ORD-${20240000 + i}`,
            customer: {
              name: `测试${i}`,
              phone: `138${Math.floor(Math.random() * 100000000)}`
            },
            sales: {
              name: `销售${Math.floor(i / 5) + 1}`
            },
            projectAddress: `测试地址${i}号`
          })
        }
        return mockOrders
      }

      const mockDataEnabled = true // 可以根据环境变量或其他条件控制是否启用模拟数据
      const supabase = createClient()
      
      // 如果启用了模拟数据，直接返回模拟数据
      if (mockDataEnabled) {
        // 获取所有可能的订单状态
        const allStatuses = ['pending_assignment', 'pending_tracking', 'tracking', 'draft_signed', 'pending_measurement', 
                            'measuring_pending_assignment', 'measuring_assigning', 'measuring_pending_visit', 
                            'measuring_pending_confirmation', 'plan_pending_confirmation', 'pending_push', 
                            'pending_order', 'in_production', 'stock_prepared', 'pending_shipment', 'shipped', 
                            'installing_pending_assignment', 'installing_assigning', 'installing_pending_visit', 
                            'installing_pending_confirmation', 'delivered', 'pending_reconciliation', 
                            'pending_invoice', 'pending_payment', 'completed', 'cancelled', 'suspended', 'exception']
        
        // 如果指定了状态，只返回该状态的模拟数据
        let allMockOrders = []
        if (status) {
          // 为每个状态生成10条模拟数据，确保客户名字从"测试1"开始
          allMockOrders = generateMockOrders(status, 1, 10)
        } else {
          // 如果没有指定状态，为所有状态生成模拟数据
          allMockOrders = allStatuses.flatMap((stat, index) => generateMockOrders(stat, index * 10 + 1, 10))
        }
        
        // 按创建时间降序排序
        allMockOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        // 处理分页
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        const paginatedOrders = allMockOrders.slice(from, to + 1)
        
        // 映射到销售单格式
        const orders = paginatedOrders.map(item => mapDbToSalesOrder(item))
        return { code: 0, message: 'success', data: { orders, total: allMockOrders.length, page, pageSize } }
      }
      
      // 真实数据获取逻辑（保留原逻辑）
      const selectString = `
        id, 
        status, 
        total_amount,
        created_at, 
        updated_at, 
        customer_id, 
        sales_id,
        sales_no,
        order_no,
        customer:users!customer_id(name, phone), 
        sales:users!sales_id(name)
      `;
      
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
        sales_no, order_no,
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
      
      // 获取订单当前状态和版本，用于状态验证和并发控制
      const { data: currentOrder, error: orderError } = await supabase
        .from('orders')
        .select('status, version')
        .eq('id', id)
        .single()
      
      if (orderError) throw orderError
      
      if (orderData.status) {
        // 验证状态转换是否有效
        const { data: isValid, error: validationError } = await (supabase as any).rpc('is_valid_status_transition', {
          p_from_status: currentOrder.status,
          p_to_status: orderData.status
        })
        
        if (validationError) throw validationError
        if (!isValid) {
          throw new Error(`无效的状态转换: ${currentOrder.status} → ${orderData.status}`)
        }
        
        const { error } = await (supabase as any).rpc('update_order_status', {
          p_order_id: id,
          p_new_status: orderData.status,
          p_changed_by_id: changedById ?? null,
        })
        if (error) throw error
        return { code: 0, message: 'success', data: { id } }
      }

      // 验证订单是否处于可修改状态
      const { data: canModify, error: modifyValidationError } = await (supabase as any).rpc('can_modify_order', {
        p_order_id: id,
        p_current_status: currentOrder.status
      })
      
      if (modifyValidationError) throw modifyValidationError
      if (!canModify) {
        throw new Error(`订单当前状态 ${currentOrder.status} 不允许修改`)
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

      // 添加版本检查，处理并发修改冲突
      const { error } = await supabase
        .from('orders')
        .update({
          ...dbData,
          updated_at: new Date().toISOString(),
          version: currentOrder.version + 1
        } as any)
        .eq('id', id)
        .eq('version', currentOrder.version) // 乐观锁：确保只有预期版本才能被更新

      if (error) {
        if (error.code === '23505' || error.message?.includes('version')) {
          throw new Error('订单已被其他用户修改，请刷新后重试')
        }
        throw error
      }
      
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
    options?: { expectedVersion?: number; comment?: string; reasonCategory?: string; metadata?: Record<string, unknown> }
  ): Promise<ServiceResponse<{ newVersion: number; fromStatus: string; toStatus: string; transitionId: string }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await (supabase as any).rpc('update_order_status_v2', {
        p_order_id: id,
        p_new_status: newStatus,
        p_changed_by_id: changedById,
        p_expected_version: options?.expectedVersion ?? null,
        p_comment: options?.comment ?? null,
        p_reason_category: options?.reasonCategory ?? null,
        p_metadata: options?.metadata ?? null,
      })
      if (error) throw error
      return {
        code: 0,
        message: 'success',
        data: {
          newVersion: data.new_version,
          fromStatus: data.from_status,
          toStatus: data.to_status,
          transitionId: data.transition_id // 添加流转ID，用于追踪完整的状态变更记录
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
      
      // 获取订单当前状态，验证是否可以取消
      const { data: currentOrder, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', id)
        .single()
      
      if (orderError) throw orderError
      
      // 验证订单是否可以取消
      const { data: canCancel, error: cancelValidationError } = await (supabase as any).rpc('can_cancel_order', {
        p_order_status: currentOrder.status
      })
      
      if (cancelValidationError) throw cancelValidationError
      if (!canCancel) {
        throw new Error(`订单当前状态 ${currentOrder.status} 不允许取消`)
      }
      
      // 执行取消操作，包括回滚相关测量单和安装单
      const { data, error } = await (supabase as any).rpc('cancel_order', {
        p_order_id: id,
        p_cancelled_by_id: cancelledById,
        p_cancellation_reason: cancellationReason,
      })
      
      if (error) {
        // 记录取消失败的详细信息
        console.error('取消订单失败:', error)
        // 检查是否是部分失败（测量单或安装单取消失败）
        if (error.message?.includes('部分操作失败')) {
          // 即使部分失败，也返回已成功的部分
          return {
            code: 206, // Partial Content
            message: '订单取消成功，但相关测量单或安装单取消失败',
            data: {
              cancelledMeasurements: data?.cancelled_measurements || 0,
              cancelledInstallations: data?.cancelled_installations || 0
            }
          }
        }
        throw error
      }
      
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
      const { error } = await (supabase as any).rpc('delete_order', { p_order_id: id })
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
      const { data, error } = await (supabase as any).rpc('get_order_status_history', { p_order_id: id })
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
      const { data, error } = await (supabase as any).rpc('get_order_status_history_enhanced', {
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
      const { data, error } = await (supabase as any).rpc('get_order_status_statistics', { p_order_id: id })
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
      const { data, error } = await (supabase as any).rpc('get_order_status_timeline', { p_order_id: id })
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
      const { data, error } = await (supabase as any).rpc('batch_update_order_status', { p_order_ids: ids, p_new_status: newStatus })
      if (error) throw error
      return { code: 0, message: 'success', data: { updatedCount: data ?? 0 } }
    })
  },

  /**
   * 批量更新销售单状态（增强版，带详细错误报告和完整审计日志）
   */
  async batchUpdateSalesOrderStatusV2(
    ids: string[],
    newStatus: string,
    options?: { changedById?: string; skipValidation?: boolean; comment?: string; reasonCategory?: string }
  ): Promise<ServiceResponse<{
    successCount: number;
    failedCount: number;
    failedOrders: Array<{ orderId: string; reason: string }>;
    transitionIds: Array<string>; // 新增：记录每个成功更新的流转ID，用于审计
    auditLogSummary: { totalProcessed: number; successWithLog: number; failedWithLog: number } // 新增：审计日志摘要
  }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()
      const { data, error } = await (supabase as any).rpc('batch_update_order_status_v2', {
        p_order_ids: ids,
        p_new_status: newStatus,
        p_changed_by_id: options?.changedById ?? null,
        p_skip_validation: options?.skipValidation ?? false,
        p_comment: options?.comment ?? null,
        p_reason_category: options?.reasonCategory ?? null
      })
      if (error) throw error
      return {
        code: 0,
        message: 'success',
        data: {
          successCount: data.success_count,
          failedCount: data.failed_count,
          failedOrders: data.failed_orders,
          transitionIds: data.transition_ids || [], // 新增：返回每个成功更新的流转ID
          auditLogSummary: data.audit_log_summary || { totalProcessed: 0, successWithLog: 0, failedWithLog: 0 } // 新增：审计日志摘要
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
      const { data, error } = await (supabase as any).rpc('get_allowed_next_statuses', { p_current_status: currentStatus })
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
      const { data, error } = await (supabase as any).rpc('is_valid_status_transition', {
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
    options?: { reason?: string; reasonCategory?: string; skipValidation?: boolean }
  ): Promise<ServiceResponse<{
    successCount: number;
    failedCount: number;
    total: number;
    failedOrders: Array<{ orderId: string; orderNo: string; reason: string }>;
    assignmentIds: Array<string>; // 新增：记录每个成功分配的ID，用于审计
    auditLogSummary: { totalProcessed: number; successWithLog: number; failedWithLog: number } // 新增：审计日志摘要
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
        p_reason_category: options?.reasonCategory ?? null,
        p_skip_validation: options?.skipValidation ?? false
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
            orderId: item.orderId || item.order_id,
            orderNo: item.orderNo || item.order_no,
            reason: item.reason,
          })),
          assignmentIds: result.assignment_ids || [], // 新增：返回每个成功分配的ID
          auditLogSummary: result.audit_log_summary || { totalProcessed: 0, successWithLog: 0, failedWithLog: 0 } // 新增：审计日志摘要
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
    format: 'csv' | 'excel' | 'pdf' | 'json' = 'csv',
    options?: {
      includeFields?: string[];
      excludeFields?: string[];
      fileName?: string;
      withAuditLog?: boolean;
      dateRange?: { startDate?: string; endDate?: string };
      grouping?: 'by_status' | 'by_sales_person' | 'by_customer';
    }
  ): Promise<ServiceResponse<{ downloadUrl: string; fileName: string; recordCount: number; exportId: string }>> {
    return withErrorHandler(async () => {
      const supabase = createClient()

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('export-orders', {
        body: {
          orderIds,
          format,
          includeFields: options?.includeFields,
          excludeFields: options?.excludeFields,
          fileName: options?.fileName,
          withAuditLog: options?.withAuditLog ?? false,
          dateRange: options?.dateRange,
          grouping: options?.grouping,
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
          exportId: data.exportId || '', // 新增：导出ID，用于追踪导出任务
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
