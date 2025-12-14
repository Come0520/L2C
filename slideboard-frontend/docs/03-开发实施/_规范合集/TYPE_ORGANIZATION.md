# TypeScript 类型文件组织规范

## 📁 目录结构

项目使用多层次的类型文件组织方式，根据类型的作用域和用途分别存放：

```
slideboard-frontend/
├── src/
│   ├── types/                    # 全局类型定义
│   ├── shared/types/             # 跨模块共享类型
│   └── features/                 # 功能模块
│       └── [module]/
│           └── types/            # 模块特定类型
```

---

## 📋 类型文件分类规则

### 1. **`src/types/`** - 全局核心类型

**用途**: 存放全局通用的、底层的类型定义

**适用场景**:
- ✅ 数据库类型（`supabase.ts`）
- ✅ 核心 API 响应格式（`api.ts`）
- ✅ 全局声明文件（`*.d.ts`）
- ✅ 测试相关类型（`test.d.ts`）
- ✅ 第三方库类型声明（`pinyin-match.d.ts`、`speech-recognition.d.ts`）

**示例**:
```typescript
// src/types/api.ts
export interface ApiErrorResponse { ... }
export enum ApiErrorCode { ... }

// src/types/supabase.ts
export interface Database { ... }
```

---

### 2. **`src/shared/types/`** - 跨模块共享业务类型

**用途**: 存放多个业务模块共同使用的业务领域类型

**适用场景**:
- ✅ 业务实体类型（`user.ts`、`customer.ts`、`lead.ts`、`order.ts`）
- ✅ 外部集成类型（`integrations.ts` - 飞书、微信等）
- ✅ 跨模块数据操作类型（`dashboard.ts`、`notification.ts`）
- ✅ 通用业务流程类型（`quote.ts`、`reconciliation.ts`）

**示例**:
```typescript
// src/shared/types/integrations.ts
export interface FeishuReportData { ... }
export interface WechatNotificationData { ... }

// src/shared/types/user.ts
export interface User { ... }
export type UserRole = 'admin' | 'sales' | ...
```

---

### 3. **`src/features/[module]/types/`** - 模块特定类型

**用途**: 存放仅在特定功能模块内使用的类型

**适用场景**:
- ✅ 模块内部的组件 Props 类型
- ✅ 模块特定的表单数据类型
- ✅ 模块内部的状态类型
- ✅ 模块特有的辅助类型

**示例**:
```typescript
// src/features/quotes/types/
export interface QuoteFormData { ... }
export interface QuoteItemRow { ... }

// src/features/measurement/types/
export interface MeasurementTemplateData { ... }
```

**当前使用该模式的模块**:
- `features/installations/types/`
- `features/measurement/types/`
- `features/purchase-orders/types/`
- `features/quotes/types/`
- `features/reconciliation/types/`

---

## 🎯 命名规范

### 文件命名

1. **使用小写 + 连字符**: `user-profile.ts`（不推荐驼峰 `userProfile.ts`）
2. **单数形式**: `user.ts`（不是 `users.ts`）
3. **语义化命名**: 
   - ✅ `integrations.ts` - 清晰表示外部集成
   - ❌ `api.ts` - 在多个目录下容易混淆

### 类型命名

1. **接口使用 PascalCase**: `interface User { ... }`
2. **枚举使用 PascalCase**: `enum UserRole { ... }`
3. **类型别名使用 PascalCase**: `type UserId = string`
4. **常量使用 UPPER_SNAKE_CASE**: `const MAX_RETRY_COUNT = 3`

---

## 🔄 导入规范

### 路径别名

使用 `@/` 别名简化导入：

```typescript
// ✅ 推荐
import { User } from '@/types/user'
import { FeishuReportData } from '@/shared/types/integrations'
import { QuoteFormData } from '@/features/quotes/types/form'

// ❌ 避免相对路径
import { User } from '../../../types/user'  
```

### 导入顺序

```typescript
// 1. 第三方库
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// 2. 全局类型
import { Database } from '@/types/supabase'
import { ApiResponse } from '@/types/api'

// 3. 共享类型
import { User } from '@/shared/types/user'
import { Lead } from '@/shared/types/lead'

// 4. 功能模块类型
import { QuoteFormData } from '@/features/quotes/types/form'

// 5. 本地类型
import { LocalState } from './types'
```

---

## 📦 重导出（Re-export）规范

### 何时使用 `index.ts`

在包含多个类型文件的目录下创建 `index.ts` 统一导出：

```typescript
// src/shared/types/index.ts
export * from './user'
export * from './lead'
export * from './order'
export * from './integrations'

// 使用时
import { User, Lead, Order } from '@/shared/types'
```

### 何时避免

- ❌ 不要在 `src/types/` 根目录创建 `index.ts`（文件太多，导出不明确）
- ❌ 不要重导出第三方类型

---

## ⚠️ 避免的反模式

### 1. 类型定义分散

❌ **错误**：同一实体的类型分散在多个文件
```typescript
// src/types/user.ts
export interface User { ... }

// src/shared/types/user.ts
export interface UserProfile { ... }  // 应该合并到一个文件
```

✅ **正确**：统一存放在一个文件
```typescript
// src/types/user.ts
export interface User { ... }
export interface UserProfile { ... }
export type UserRole = ...
```

### 2. 循环依赖

❌ **错误**：
```typescript
// types/a.ts
import { B } from './b'
export interface A { b: B }

// types/b.ts
import { A } from './a'
export interface B { a: A }
```

✅ **正确**：提取共同依赖或使用类型参数

### 3. 类型与实现混合

❌ **错误**：
```typescript
// services/user.ts
export interface UserService { ... }  // 类型与服务实现在一起
export class UserService implements UserService { ... }
```

✅ **正确**：
```typescript
// types/services.ts
export interface IUserService { ... }

// services/user.ts
import { IUserService } from '@/types/services'
export class UserService implements IUserService { ... }
```

---

## 📝 维护建议

1. **定期审查**: 每个 Sprint 结束时审查类型文件组织
2. **重复检测**: 使用工具检测重复的类型定义
3. **文档同步**: 类型变更时更新相关文档
4. **渐进迁移**: 对于老代码，逐步按新规范调整

---

## 🔍 当前项目映射

| 目录 | 文件数 | 主要内容 |
|------|--------|---------|
| `src/types/` | 16 | 数据库、API、测试、第三方声明 |
| `src/shared/types/` | 17 | 用户、订单、线索、集成等业务类型 |
| `src/features/*/types/` | 5+ | 各功能模块特定类型 |

---

## 📅 更新记录

- **2024-12-14**: 初始版本，定义基本组织规则
- **2024-12-14**: 合并 `supabase.ts` 和 `teams.ts`，重命名 `api.ts` → `integrations.ts`
