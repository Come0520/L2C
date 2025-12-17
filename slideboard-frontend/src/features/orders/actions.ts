'use server'

import { createClient } from '@/lib/supabase/server'

// 类型定义
interface SalesOrder {
  id: string
  status: string
  customer_name?: string
  project_address?: string
  created_at: string
  reconciliation_notes?: string
  measurement_order?: MeasurementOrder[]
}

interface MeasurementOrder {
  id: string
  assigned_at?: string
  last_urged_at?: string
  measurer?: Measurer[]
}

interface Measurer {
  id: string
  name: string
}

// 获取待对账订单
export async function getReconciliationOrders(): Promise<SalesOrder[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sales_orders')
    .select(`*
      , customer:customers(*)
      , sales:sales(*)
    `)
    .eq('status', 'pending_reconciliation')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data as unknown as SalesOrder[]
}

// 完成对账
export async function completeReconciliation(orderIds: string[]): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sales_orders')
    .update({ status: 'pending_invoice' })
    .in('id', orderIds)

  if (error) {
    throw error
  }

  return { success: true }
}

// 提交差异对账
export async function submitDifferenceReconciliation(orderIds: string[], reason: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sales_orders')
    .update({
      status: 'reconciliation_difference',
      reconciliation_notes: reason
    })
    .in('id', orderIds)

  if (error) {
    throw error
  }

  return { success: true }
}

// 催单功能
export async function urgeOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  // 1. 获取订单信息，包括测量师信息
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(`*
      , measurement_order:measurement_orders(*
        , measurer:measurers(*)
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError) {
    throw orderError
  }

  const typedOrder = order as unknown as SalesOrder
  const measurementOrder = typedOrder?.measurement_order?.[0]
  const measurer = measurementOrder?.measurer?.[0]

  if (!measurer || !measurementOrder) {
    throw new Error('订单未分配测量师')
  }

  // 2. 发送催单消息给测量师
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: measurer.id,
      title: '催单提醒',
      content: `订单 ${typedOrder.id} 需要尽快处理，客户 ${typedOrder.customer_name} 的测量任务等待中`,
      type: 'urge_order',
      metadata: {
        orderId: typedOrder.id,
        customerName: typedOrder.customer_name,
        address: typedOrder.project_address,
        waitingTime: calculateWaitingTime(measurementOrder.assigned_at || new Date().toISOString())
      }
    })

  if (notificationError) {
    throw notificationError
  }

  // 3. 更新测量订单的催单记录
  const { error: updateError } = await supabase
    .from('measurement_orders')
    .update({
      last_urged_at: new Date().toISOString()
    })
    .eq('id', measurementOrder.id)

  if (updateError) {
    throw updateError
  }

  return { success: true, message: '催单成功' }
}

// 计算等待时间
function calculateWaitingTime(assignedAt: string): string {
  const now = new Date()
  const assignedDate = new Date(assignedAt)
  const diff = now.getTime() - assignedDate.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

export async function createOrder(orderData: Record<string, unknown>): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_order', { order_data: orderData })
  if (error) throw error
  return { id: data as string }
}

export async function updateOrder(orderId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: 'updated',
    p_changed_by_id: null
  })
  if (error) throw error
  return { success: true }
}

