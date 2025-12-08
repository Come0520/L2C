# 日志系统标准化实施计划

## 1. 项目日志系统分析

### 现有日志系统
- 基于Supabase的日志记录系统，无传统配置文件
- 核心服务：`src/services/logs.client.ts`
- 类型定义：`src/types/logs.ts`
- 提供`logsService`单例和便捷函数

### 日志级别支持
- info：普通信息
- warning：警告信息
- error：错误信息
- debug：调试信息

## 2. 实施范围

### 需要处理的文件
1. `src/app/system/team/page.tsx` - 5处console.error
2. `src/app/quotes/collaboration/[id]/page.tsx` - 4处console.error
3. `src/app/api/collaboration/invite/route.ts` - 待检查
4. `src/components/shared/slide-card.tsx` - 待检查

## 3. 替换策略

### 1. 正确引入logger
```typescript
import { logsService } from '@/services/logs.client';
import { LogAction, LogLevel } from '@/types/logs';
```

### 2. 结构化优化
- 将简单console语句转换为结构化logger调用
- 示例：
  ```typescript
  // 原代码
  console.log('User created', user);
  
  // 优化后
  await logsService.createLog({
    userId: 'current_user_id',
    userName: '当前用户名',
    action: 'create_user',
    level: 'info',
    resourceId: user.id,
    resourceType: 'user',
    details: { user }
  });
  ```

### 3. 错误处理
- 确保错误信息完整记录
- 示例：
  ```typescript
  // 原代码
  console.error('Failed to load teams:', error);
  
  // 优化后
  await logsService.createLog({
    userId: 'current_user_id',
    userName: '当前用户名',
    action: 'load_teams',
    level: 'error',
    resourceType: 'team',
    details: { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }
  });
  ```

### 4. 清理噪音
- 删除明显的临时调试断点，如`console.log('here')`或`console.log(123)`

## 4. 实施步骤

### 步骤1：处理`src/app/system/team/page.tsx`
- 替换5处console.error语句
- 添加logger引入
- 结构化记录错误信息

### 步骤2：处理`src/app/quotes/collaboration/[id]/page.tsx`
- 替换4处console.error语句
- 添加logger引入
- 结构化记录错误信息

### 步骤3：处理`src/app/api/collaboration/invite/route.ts`
- 检查并替换console语句
- 确保API路由中的日志正确记录

### 步骤4：处理`src/components/shared/slide-card.tsx`
- 检查并替换console语句
- 确保组件中的日志正确记录

### 步骤5：验证测试
- 确保所有logger调用正常工作
- 检查日志是否正确记录到Supabase

## 5. 注意事项

### 异步处理
- logger调用是异步的，需要使用await或适当处理Promise

### 用户信息获取
- 需要确保能获取到当前用户ID和用户名

### 资源信息完整性
- 记录日志时确保资源ID、类型等信息完整

### 错误堆栈处理
- 确保错误堆栈在生产环境中安全记录

## 6. 预期成果

- 所有console语句替换为结构化logger调用
- 日志统一记录到Supabase
- 便于后续日志查询和分析
- 提高系统可维护性和可观测性

## 7. 后续优化建议

- 考虑添加全局错误捕获
- 实现日志级别动态配置
- 添加日志采样机制
- 实现日志聚合和分析功能

## 8. 实施时间

- 预计总实施时间：1-2小时
- 每文件处理时间：15-30分钟

## 9. 风险评估

### 低风险
- 日志系统已成熟，API稳定
- 替换逻辑简单，不易引入新bug

### 注意事项
- 确保用户信息获取逻辑正确
- 确保异步调用处理得当

## 10. 验收标准

- 所有console语句替换完成
- 日志正确记录到Supabase
- 系统功能正常，无新bug引入
- 代码符合项目命名规范和最佳实践