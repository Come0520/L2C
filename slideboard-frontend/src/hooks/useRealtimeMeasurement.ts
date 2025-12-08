// 实时测量单钩子

import { useEffect, useState, useRef, useCallback } from 'react';

import { supabase } from '@/lib/supabase/client';
import { Measurement } from '@/types/measurement';

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
 * 使用实时测量单钩子
 * @param measurementId 测量单ID
 * @param initialData 初始数据
 * @returns 实时更新的测量单数据
 */
export function useRealtimeMeasurement(measurementId: string, initialData: Measurement | null) {
  const [measurement, setMeasurement] = useState<Measurement | null>(initialData);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 节流处理数据更新，避免频繁重渲染
  const throttledUpdateMeasurement = throttle((payload: any) => {
    if (payload.new) {
      setMeasurement(payload.new as Measurement);
    }
  }, 200);

  const setupSubscription = useCallback(() => {
    if (!measurementId) {
      return;
    }

    // 清理之前的订阅
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // 创建实时订阅频道
    const channel = supabase
      .channel(`measurement:${measurementId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // 监听所有事件（INSERT, UPDATE, DELETE）
          schema: 'public',
          table: 'measurements',
          filter: `id=eq.${measurementId}`
        },
        throttledUpdateMeasurement
      )
      .on('system', { event: 'error' }, () => {
        // 错误事件回调
      })
      .on('system', { event: 'close' }, () => {
        // 连接关闭时尝试重连
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            setupSubscription();
          }, 2000);
        }
      })
      .subscribe();

    // 保存订阅引用，以便在组件卸载时取消订阅
    subscriptionRef.current = channel;
  }, [measurementId, throttledUpdateMeasurement]);

  useEffect(() => {
    setupSubscription();

    // 组件卸载时取消订阅和清理定时器
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [setupSubscription]);

  return {
    measurement
  };
}

/**
 * 使用实时测量单列表钩子
 * @param initialData 初始数据
 * @returns 实时更新的测量单列表
 */
export function useRealtimeMeasurements(initialData: Measurement[]) {
  const [measurements, setMeasurements] = useState<Measurement[]>(initialData);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 节流处理数据更新，避免频繁重渲染
  const throttledUpdateMeasurements = useCallback((payload: any) => {
    setMeasurements(prevMeasurements => {
      const newMeasurements = [...prevMeasurements];
      const newId = payload.new?.id;
      const oldId = payload.old?.id;
      const index = newMeasurements.findIndex(m => m.id === newId || m.id === oldId);

      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            return [payload.new as Measurement, ...newMeasurements];
          }
          break;
        case 'UPDATE':
          if (payload.new && index !== -1) {
            newMeasurements[index] = payload.new as Measurement;
            return newMeasurements;
          }
          break;
        case 'DELETE':
          if (oldId && index !== -1) {
            return newMeasurements.filter(m => m.id !== oldId);
          }
          break;
        default:
          break;
      }

      return newMeasurements;
    });
  }, []);

  const setupSubscription = useCallback(() => {
    // 清理之前的订阅
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // 创建实时订阅频道
    const channel = supabase
      .channel('measurements:list')
      .on(
        'postgres_changes',
        {
          event: '*', // 监听所有事件（INSERT, UPDATE, DELETE）
          schema: 'public',
          table: 'measurements'
        },
        throttledUpdateMeasurements
      )
      .on('system', { event: 'error' }, () => {
        // 错误事件回调
      })
      .on('system', { event: 'close' }, () => {
        // 连接关闭时尝试重连
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            setupSubscription();
          }, 2000);
        }
      })
      .subscribe();

    // 保存订阅引用，以便在组件卸载时取消订阅
    subscriptionRef.current = channel;
  }, [throttledUpdateMeasurements]);

  useEffect(() => {
    setupSubscription();

    // 组件卸载时取消订阅和清理定时器
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [setupSubscription]);

  return {
    measurements
  };
}
