# 任务 6：可运维性增强

## 任务概述

建立结构化日志系统，增强 API 层的错误处理和可观测性。

## 项目上下文

- **项目路径**：`miniprogram-taro/`
- **技术栈**：Taro 4.x + React 18 + TypeScript + Zustand
- **现有 API 层**：`src/services/api.ts` — 当前仅使用 `console.error` 记录错误
- **认证 Store**：`src/stores/auth.ts` — 提供 `useAuthStore.getState().userInfo`
- **注释语言**：所有代码注释必须使用中文

## 交付物

### 1. 创建 `src/utils/logger.ts` — 结构化日志工具

```typescript
/**
 * 结构化日志工具
 *
 * @description 统一的日志记录接口，自动附带时间戳和用户上下文。
 * 开发环境输出到 console，生产环境可对接微信实时日志。
 */
import { useAuthStore } from '@/stores/auth';

/** 日志级别 */
type LogLevel = 'info' | 'warn' | 'error';

/** 日志条目 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  action: string;
  userId?: string;
  data?: Record<string, any>;
  error?: string;
}

/**
 * 格式化日志条目
 */
function createEntry(
  level: LogLevel,
  module: string,
  action: string,
  data?: Record<string, any>,
  error?: Error
): LogEntry {
  const userInfo = useAuthStore.getState().userInfo;
  return {
    timestamp: new Date().toISOString(),
    level,
    module,
    action,
    userId: userInfo?.id,
    data,
    error: error?.message,
  };
}

export const Logger = {
  /** 信息日志 */
  info(module: string, action: string, data?: Record<string, any>) {
    const entry = createEntry('info', module, action, data);
    console.log(`[${entry.module}] ${entry.action}`, entry);
  },

  /** 警告日志 */
  warn(module: string, action: string, data?: Record<string, any>) {
    const entry = createEntry('warn', module, action, data);
    console.warn(`[${entry.module}] ${entry.action}`, entry);
  },

  /** 错误日志 */
  error(module: string, action: string, error: Error, data?: Record<string, any>) {
    const entry = createEntry('error', module, action, data, error);
    console.error(`[${entry.module}] ${entry.action}`, entry);
  },
};
```

### 2. 创建 `src/utils/network.ts` — 网络状态检测

```typescript
/**
 * 网络状态检测工具
 */
import Taro from '@tarojs/taro';

/** 检查网络是否可用 */
export async function checkNetwork(): Promise<boolean> {
  try {
    const res = await Taro.getNetworkType();
    return res.networkType !== 'none';
  } catch {
    return false;
  }
}

/** 显示断网提示 */
export function showOfflineToast() {
  Taro.showToast({
    title: '网络连接不可用，请检查网络设置',
    icon: 'none',
    duration: 3000,
  });
}
```

### 3. 修改 `src/services/api.ts` — 添加请求日志

在现有 `request` 函数中添加以下增强（**不改变现有返回值结构**）：

```typescript
// 在 try 块开始前记录请求
Logger.info('API', '发起请求', { method, url });

// 在成功响应后记录
Logger.info('API', '请求成功', {
  method,
  url,
  statusCode: res.statusCode,
  duration: Date.now() - startTime,
});

// 在 catch 块中替换现有 console.error
Logger.error('API', '请求失败', err instanceof Error ? err : new Error(String(err.errMsg || err)), {
  method,
  url,
});

// 可选：GET 请求网络错误时简单重试一次
if (method === 'GET' && isNetworkError(err)) {
  Logger.warn('API', '网络错误，重试一次', { method, url });
  return request(url, { ...options, _retried: true });
}
```

> **注意**：重试只针对 GET 请求，且最多重试 1 次（通过 `_retried` 标志位控制）。

### 4. 编写单元测试

创建 `src/utils/__tests__/logger.test.ts`，至少包含：

| 用例 | 描述                                |
| :--- | :---------------------------------- |
| 1    | `Logger.info` 应输出正确格式的日志  |
| 2    | `Logger.warn` 应使用 console.warn   |
| 3    | `Logger.error` 应包含 error.message |
| 4    | 日志条目应包含 timestamp            |
| 5    | 已登录时日志应包含 userId           |
| 6    | 未登录时日志 userId 应为 undefined  |

## 约束

- **不改变** `api.ts` 的返回值结构（`ApiResponse<T>`）
- **不改变** 现有错误处理流程（401 仍自动登出）
- 重试逻辑只适用于 GET + 网络错误，不适用于 HTTP 错误
- Logger 在生产环境中仍使用 console（后续可扩展接入微信实时日志）

## 验证标准

```bash
cd miniprogram-taro && npx jest src/utils/__tests__/logger.test.ts
# 输出：1 test suite, 6 tests passed

cd miniprogram-taro && npx taro build --type weapp
# 编译无错误
```
