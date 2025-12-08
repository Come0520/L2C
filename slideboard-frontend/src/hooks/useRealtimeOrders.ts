// 实时订单钩子

import { useState, useMemo } from 'react';

import { BaseOrder } from '@/shared/types/order';

import { useRealtimeSubscription } from './useRealtimeSubscription'

/**
 * 节流函数
 * @param func 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
function throttle<T extends (...args: any[]) => any>(func: T, delay: number) {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 使用实时订单列表钩子
 * @param initialData 初始数据
 * @returns 实时更新的订单列表
 */
export function useRealtimeOrders<T extends BaseOrder>(initialData: T[]) {
  const [orders, setOrders] = useState<T[]>(initialData);

  // 处理数据更新，避免频繁重渲染
  const throttledUpdateOrders = throttle((payload: any) => {
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const newId = (payload.new as { id?: string })?.id;
      const oldId = (payload.old as { id?: string })?.id;
      const index = newOrders.findIndex(o => o.id === newId || o.id === oldId);

      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            return [payload.new as T, ...newOrders];
          }
          break;
        case 'UPDATE':
          if (payload.new && index !== -1) {
            newOrders[index] = payload.new as T;
            return newOrders;
          }
          break;
        case 'DELETE':
          if (oldId && index !== -1) {
            return newOrders.filter(o => o.id !== oldId);
          }
          break;
        default:
          break;
      }

      return newOrders;
    });
  }, 200);

  useRealtimeSubscription({
    table: 'sales_orders',
    event: '*',
    channelName: 'sales_orders:list',
    handler: throttledUpdateOrders as any
  })

  return {
    orders
  };
}

/**
 * 使用实时订单详情钩子
 * @param orderId 订单ID
 * @param initialData 初始数据
 * @returns 实时更新的订单详情
 */
export function useRealtimeOrder<T extends BaseOrder>(orderId: string, initialData: T | null) {
  const [order, setOrder] = useState<T | null>(initialData);

  // 处理数据更新，避免频繁重渲染
  const throttledUpdateOrder = useMemo(
    () => throttle((payload: any) => {
      if (payload.new) {
        setOrder(payload.new as T);
      }
    }, 200),
    []
  );

  useRealtimeSubscription({
    table: 'sales_orders',
    event: '*',
    filter: orderId ? `id=eq.${orderId}` : undefined,
    channelName: orderId ? `sales_orders:${orderId}` : 'sales_orders:detail',
    handler: throttledUpdateOrder as any
  })

  return {
    order
  };
}
