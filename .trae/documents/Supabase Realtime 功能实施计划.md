# Supabase Realtime 功能实施计划

## 目标
为 `sales_orders` 和 `quotes` 表启用实时订阅功能，使前端能自动接收数据变更通知。

## 实施步骤

### 1. 数据库配置

#### 1.1 启用表的 Realtime 功能
在 Supabase Dashboard 中启用 `sales_orders` 和 `quotes` 表的 Realtime 功能，或通过以下 SQL 命令：

```sql
-- 启用 sales_orders 表的 Realtime 功能
ALTER TABLE sales_orders ENABLE REPLICA IDENTITY FULL;

-- 启用 quotes 表的 Realtime 功能
ALTER TABLE quotes ENABLE REPLICA IDENTITY FULL;
```

#### 1.2 确认 RLS 策略
确保现有的 RLS 策略允许用户订阅数据。对于 `sales_orders` 和 `quotes` 表，我们需要确保 SELECT 权限的 RLS 策略已经正确配置。

### 2. 前端实现

#### 2.1 为 quotes 表创建实时订阅钩子
创建 `useRealtimeQuotes.ts` 钩子，类似现有的 `useRealtimeOrders.ts`：

```typescript
import { useState } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { Quote } from '@/types/quote';

/**
 * 使用实时报价单列表钩子
 * @param initialData 初始数据
 * @returns 实时更新的报价单列表
 */
export function useRealtimeQuotes<T extends Quote>(initialData: T[]) {
  const [quotes, setQuotes] = useState<T[]>(initialData);

  useRealtimeSubscription({
    table: 'quotes',
    event: '*',
    channelName: 'quotes:list',
    handler: (payload) => {
      setQuotes(prevQuotes => {
        // 类似 orders 的更新逻辑
        const newId = payload.new?.id;
        const oldId = payload.old?.id;
        const index = prevQuotes.findIndex(q => q.id === newId || q.id === oldId);

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              return [payload.new as T, ...prevQuotes];
            }
            break;
          case 'UPDATE':
            if (payload.new && index !== -1) {
              const updatedQuotes = [...prevQuotes];
              updatedQuotes[index] = payload.new as T;
              return updatedQuotes;
            }
            break;
          case 'DELETE':
            if (oldId) {
              return prevQuotes.filter(q => q.id !== oldId);
            }
            break;
          default:
            break;
        }

        return prevQuotes;
      });
    }
  });

  return {
    quotes
  };
}

/**
 * 使用实时报价单详情钩子
 * @param quoteId 报价单ID
 * @param initialData 初始数据
 * @returns 实时更新的报价单详情
 */
export function useRealtimeQuote<T extends Quote>(quoteId: string, initialData: T | null) {
  const [quote, setQuote] = useState<T | null>(initialData);

  useRealtimeSubscription({
    table: 'quotes',
    event: '*',
    filter: quoteId ? `id=eq.${quoteId}` : undefined,
    channelName: quoteId ? `quotes:${quoteId}` : 'quotes:detail',
    handler: (payload) => {
      if (payload.new) {
        setQuote(payload.new as T);
      }
    }
  });

  return {
    quote
  };
}
```

#### 2.2 更新现有组件以使用实时钩子
在相关组件中使用新创建的 `useRealtimeQuotes` 和 `useRealtimeQuote` 钩子，替换现有的静态数据获取方式。

### 3. 测试和验证

#### 3.1 编写测试脚本
创建一个测试脚本来验证实时订阅是否正常工作：

```typescript
// test-realtime-subscription.ts
import { createClient } from '@/lib/supabase/client';

async function testRealtimeSubscription() {
  console.log('Testing Realtime Subscription...');
  
  const supabase = createClient();
  
  // 测试 sales_orders 表订阅
  const salesOrderChannel = supabase
    .channel('test-sales-orders-channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'sales_orders' },
      (payload) => {
        console.log('Sales Order Change Received:', payload);
      }
    )
    .subscribe();
  
  // 测试 quotes 表订阅
  const quoteChannel = supabase
    .channel('test-quotes-channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'quotes' },
      (payload) => {
        console.log('Quote Change Received:', payload);
      }
    )
    .subscribe();
  
  console.log('Subscriptions started. Waiting for changes...');
  
  // 保持脚本运行，等待接收变更
  setTimeout(() => {
    console.log('Unsubscribing...');
    supabase.removeChannel(salesOrderChannel);
    supabase.removeChannel(quoteChannel);
  }, 60000); // 运行60秒后退出
}

testRealtimeSubscription().catch(console.error);
```

#### 3.2 运行测试
执行测试脚本，然后在 Supabase Dashboard 中手动修改 `sales_orders` 或 `quotes` 表的数据，观察是否能收到实时通知。

## 交付物

1. 迁移脚本（如需要），用于启用表的 Realtime 功能
2. 前端实时订阅钩子（`useRealtimeQuotes.ts`）
3. 测试脚本（`test-realtime-subscription.ts`），用于验证订阅功能

## 注意事项

1. 确保只有必要的表和字段启用了 Realtime 功能，以减少不必要的网络流量
2. 为实时订阅添加适当的错误处理和重连机制
3. 在生产环境中，考虑对实时更新进行节流或防抖处理，避免频繁重渲染
4. 确保 RLS 策略正确配置，防止未授权用户订阅数据