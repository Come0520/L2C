# 埋点分析工具使用指南

## 1. 概述

埋点分析工具用于追踪用户行为、页面访问和系统性能，帮助团队了解用户交互模式和系统健康状况。

## 2. 功能特性

- ✅ 事件追踪：记录用户交互事件
- ✅ 页面访问：追踪页面浏览情况
- ✅ 性能监控：测量关键操作耗时
- ✅ 错误追踪：集成Sentry错误报告
- ✅ 批量发送：减少网络请求
- ✅ 环境区分：开发环境可配置不发送
- ✅ 类型安全：提供完整的TypeScript支持

## 3. 快速开始

### 3.1 导入埋点工具

```typescript
// 导入单个函数
import { TRACK_EVENT, TRACK_PAGE_VIEW } from '@/utils/analytics';

// 或导入默认对象
import analytics from '@/utils/analytics';
```

### 3.2 基本使用

#### 3.2.1 追踪页面访问

在React组件中使用：

```typescript
import { useEffect } from 'react';
import { TRACK_PAGE_VIEW } from '@/utils/analytics';

function MyPage() {
  useEffect(() => {
    TRACK_PAGE_VIEW('my-page', {
      component: 'MyPage',
      additionalData: 'value'
    });
  }, []);

  return <div>My Page</div>;
}
```

#### 3.2.2 追踪用户事件

```typescript
import { TRACK_EVENT } from '@/utils/analytics';

function MyButton() {
  const handleClick = () => {
    TRACK_EVENT('user', 'click', 'my-button', {
      buttonType: 'primary',
      context: 'homepage'
    });
    // 其他按钮逻辑
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

#### 3.2.3 性能监控

```typescript
import { START_TIMER, STOP_TIMER } from '@/utils/analytics';

async function fetchData() {
  // 开始计时
  START_TIMER('fetch-data', {
    endpoint: '/api/data'
  });

  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    
    // 停止计时并记录性能
    STOP_TIMER('fetch-data', {
      success: true,
      dataSize: JSON.stringify(data).length
    });

    return data;
  } catch (error) {
    // 记录失败情况
    STOP_TIMER('fetch-data', {
      success: false,
      error: error.message
    });
    throw error;
  }
}
```

#### 3.2.4 错误追踪

```typescript
import { TRACK_ERROR } from '@/utils/analytics';

try {
  // 可能出错的代码
  throw new Error('Something went wrong');
} catch (error) {
  TRACK_ERROR(error as Error, {
    context: 'my-function',
    additionalInfo: 'some data'
  });
}
```

## 4. API 参考

### 4.1 TRACK_EVENT

```typescript
TRACK_EVENT(category: string, action: string, label?: string, properties?: Record<string, unknown>): void
```

- **category**: 事件类别（如："user", "order", "system"）
- **action**: 事件动作（如："click", "create", "update"）
- **label**: 事件标签（可选，如："submit-button", "order-123"）
- **properties**: 附加属性（可选）

### 4.2 TRACK_PAGE_VIEW

```typescript
TRACK_PAGE_VIEW(pageName: string, properties?: Record<string, unknown>): void
```

- **pageName**: 页面名称（如："dashboard", "orders-create"）
- **properties**: 附加属性（可选）

### 4.3 START_TIMER

```typescript
START_TIMER(key: string, properties?: Record<string, unknown>): void
```

- **key**: 计时器唯一标识
- **properties**: 附加属性（可选）

### 4.4 STOP_TIMER

```typescript
STOP_TIMER(key: string, properties?: Record<string, unknown>): number | null
```

- **key**: 计时器唯一标识
- **properties**: 附加属性（可选）
- **返回值**: 耗时（毫秒），如果计时器不存在则返回null

### 4.5 TRACK_ERROR

```typescript
TRACK_ERROR(error: Error, context?: Record<string, unknown>): void
```

- **error**: Error对象
- **context**: 错误上下文（可选）

### 4.6 FLUSH

```typescript
FLUSH(): void
```

手动刷新所有待发送的事件队列。

## 5. 配置说明

埋点工具的配置位于`src/utils/analytics.ts`文件中：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| batchSize | number | 10 | 批量发送的事件数量 |
| batchInterval | number | 5000 | 批量发送的时间间隔（毫秒） |
| enabled | boolean | process.env.NODE_ENV !== 'development' | 是否启用埋点 |
| debug | boolean | process.env.NODE_ENV !== 'production' | 是否开启调试日志 |

## 6. 最佳实践

### 6.1 命名规范

- **category**: 使用小写字母，用短横线分隔（如："user-interaction"）
- **action**: 使用动词，小写字母（如："click", "submit"）
- **label**: 使用有意义的名称，可包含ID（如："login-button", "order-123"）
- **properties**: 使用驼峰命名法（如："buttonType", "userId"）

### 6.2 埋点范围

建议在以下场景中添加埋点：

- 页面访问（进入页面时）
- 用户交互（按钮点击、表单提交等）
- 关键业务流程（订单创建、支付完成等）
- 系统性能（API调用、数据加载等）
- 错误情况（捕获的异常）

### 6.3 性能考虑

- 避免在高频事件（如滚动、拖拽）中直接调用埋点函数
- 对于高频事件，考虑使用节流或防抖
- 合理设置batchSize和batchInterval，平衡实时性和性能

## 7. 开发与测试

### 7.1 开发环境

在开发环境中，埋点事件默认不会发送到服务器，但会在控制台输出日志。

### 7.2 生产环境

在生产环境中，埋点事件会按照配置批量发送到服务器。

### 7.3 测试

可以使用以下方法测试埋点功能：

1. 查看浏览器控制台日志（开发环境）
2. 检查Sentry控制台（错误追踪）
3. 使用网络监控工具查看发送的请求

## 8. 集成Sentry

埋点工具已集成Sentry，可通过`TRACK_ERROR`函数将错误发送到Sentry。

Sentry配置位于以下文件：
- `sentry.client.config.ts`（客户端配置）
- `sentry.server.config.ts`（服务端配置）
- `sentry.edge.config.ts`（Edge运行时配置）

## 9. 示例代码

### 9.1 页面组件示例

```typescript
'use client';

import { useEffect } from 'react';
import { TRACK_PAGE_VIEW, TRACK_EVENT } from '@/utils/analytics';
import { Button } from '@/components/ui/button';

function DashboardPage() {
  // 追踪页面访问
  useEffect(() => {
    TRACK_PAGE_VIEW('dashboard', {
      component: 'DashboardPage'
    });
  }, []);

  const handleCreateOrder = () => {
    // 追踪创建订单按钮点击
    TRACK_EVENT('order', 'click', 'create-order', {
      source: 'dashboard'
    });
    // 其他逻辑
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <Button onClick={handleCreateOrder}>创建订单</Button>
    </div>
  );
}

export default DashboardPage;
```

### 9.2 API调用性能监控

```typescript
import { START_TIMER, STOP_TIMER, TRACK_ERROR } from '@/utils/analytics';

async function fetchUserOrders(userId: string) {
  const timerKey = `fetch-orders-${userId}`;
  
  // 开始计时
  START_TIMER(timerKey, {
    userId,
    endpoint: '/api/orders'
  });

  try {
    const response = await fetch(`/api/orders?userId=${userId}`);
    const orders = await response.json();
    
    // 停止计时，记录成功
    STOP_TIMER(timerKey, {
      success: true,
      orderCount: orders.length
    });

    return orders;
  } catch (error) {
    // 停止计时，记录失败
    STOP_TIMER(timerKey, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // 追踪错误
    TRACK_ERROR(error instanceof Error ? error : new Error('API Error'), {
      userId,
      endpoint: '/api/orders'
    });
    
    throw error;
  }
}
```

## 10. 故障排查

### 10.1 事件未发送

检查以下情况：

1. 确认`enabled`配置为`true`
2. 检查浏览器控制台是否有错误信息
3. 确认网络连接正常
4. 检查事件队列是否达到批量发送条件

### 10.2 错误未上报到Sentry

检查以下情况：

1. 确认Sentry DSN配置正确
2. 检查Sentry客户端配置
3. 确认错误对象正确传递给`TRACK_ERROR`函数
4. 检查浏览器控制台是否有Sentry相关错误

## 11. 版本历史

### v1.0.0

- ✅ 初始版本
- ✅ 事件追踪功能
- ✅ 页面访问追踪
- ✅ 性能监控
- ✅ 错误追踪集成
- ✅ 批量发送机制

## 12. 贡献指南

如有任何改进建议或问题，请联系开发团队。

---

**最后更新时间**：2024-01-01
**维护者**：开发团队