# 数据库类型统一规范

> 版本: v1.0 | 更新日期: 2024-12-16

本规范定义了项目中数据库相关类型的命名规则、统一定义和最佳实践。

---

## 📋 用户角色类型 (UserRole)

### 统一定义

所有用户角色类型**必须使用大写蛇形命名（UPPER_SNAKE_CASE）**。

```typescript
// 文件: src/shared/types/user.ts

/**
 * 用户角色类型
 * 命名规则: {类别}_{具体角色}
 */
export type UserRole =
  // ═══════════════════════════════════════════
  // 管理类角色 (LEAD_*)
  // ═══════════════════════════════════════════
  | 'LEAD_ADMIN'           // 系统管理员（最高权限）
  | 'LEAD_GENERAL'         // 普通领导
  | 'LEAD_VIEWER'          // 只读领导
  
  // ═══════════════════════════════════════════
  // 销售类角色 (SALES_* / LEAD_SALES / LEAD_CHANNEL)
  // ═══════════════════════════════════════════
  | 'SALES_STORE'          // 驻店销售
  | 'SALES_REMOTE'         // 远程销售
  | 'SALES_CHANNEL'        // 渠道销售
  | 'LEAD_SALES'           // 销售主管
  | 'LEAD_CHANNEL'         // 渠道主管
  
  // ═══════════════════════════════════════════
  // 服务类角色 (SERVICE_* / DELIVERY_*)
  // ═══════════════════════════════════════════
  | 'SERVICE_DISPATCH'     // 服务调度
  | 'SERVICE_MEASURE'      // 测量师
  | 'SERVICE_INSTALL'      // 安装师
  | 'DELIVERY_SERVICE'     // 订单客服
  
  // ═══════════════════════════════════════════
  // 审批类角色 (APPROVER_*)
  // ═══════════════════════════════════════════
  | 'APPROVER_BUSINESS'    // 业务审批人
  | 'APPROVER_FINANCIAL'   // 财务审批人
  | 'APPROVER_MANAGEMENT'  // 管理审批人
  
  // ═══════════════════════════════════════════
  // 财务/客户类角色 (OTHER_*)
  // ═══════════════════════════════════════════
  | 'OTHER_FINANCE'        // 财务人员
  | 'OTHER_CUSTOMER'       // 客户
  
  // ═══════════════════════════════════════════
  // 合作伙伴角色 (PARTNER_*)
  // ═══════════════════════════════════════════
  | 'PARTNER_DESIGNER'     // 设计师
  | 'PARTNER_GUIDE'        // 导购
  
  // ═══════════════════════════════════════════
  // 基础用户角色 (USER_*)
  // ═══════════════════════════════════════════
  | 'USER_BASIC';          // 基础用户（默认角色）
```

### 已废弃角色映射

| 废弃值 | 替代值 | 说明 |
|--------|--------|------|
| `admin` | `LEAD_ADMIN` | 系统管理员 |
| `user` | `USER_BASIC` | 基础用户 |
| `pro` | `USER_BASIC` | 合并到基础用户 |

### 角色中文名称对照

```typescript
export const ROLE_LABELS: Record<UserRole, string> = {
  LEAD_ADMIN: '系统管理员',
  LEAD_GENERAL: '领导',
  LEAD_VIEWER: '领导（只读）',
  SALES_STORE: '驻店销售',
  SALES_REMOTE: '远程销售',
  SALES_CHANNEL: '渠道销售',
  LEAD_SALES: '销售主管',
  LEAD_CHANNEL: '渠道主管',
  SERVICE_DISPATCH: '服务调度',
  SERVICE_MEASURE: '测量师',
  SERVICE_INSTALL: '安装师',
  DELIVERY_SERVICE: '订单客服',
  APPROVER_BUSINESS: '业务审批人',
  APPROVER_FINANCIAL: '财务审批人',
  APPROVER_MANAGEMENT: '管理审批人',
  OTHER_FINANCE: '财务',
  OTHER_CUSTOMER: '客户',
  PARTNER_DESIGNER: '设计师',
  PARTNER_GUIDE: '导购',
  USER_BASIC: '基础用户'
};
```

---

## 📊 状态类型规范

### 命名规则

状态类型使用**小写蛇形命名（lower_snake_case）**，常量对象使用**大写蛇形命名**。

```typescript
// ✅ 正确
export const ORDER_STATUS = {
  PENDING_ASSIGNMENT: 'pending_assignment',
  COMPLETED: 'completed'
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// ❌ 错误
export type OrderStatus = 'PENDING_ASSIGNMENT' | 'completed';  // 风格不一致
```

### 状态类型分类

| 类型名称 | 文件路径 | 用途 |
|----------|----------|------|
| `OrderStatus` | `src/constants/order-status.ts` | 订单状态 |
| `LeadStatus` | `src/constants/lead-status.ts` | 线索状态 |
| `MeasurementStatus` | `src/constants/measurement-status.ts` | 测量状态 |
| `ReconciliationOrderStatus` | `src/constants/reconciliation-order-status.ts` | 对账状态 |

---

## 🔗 数据库字段类型映射

### PostgreSQL → TypeScript 类型对照

| PostgreSQL | TypeScript | 说明 |
|------------|------------|------|
| `uuid` | `string` | UUID 字段 |
| `text` | `string` | 文本字段 |
| `varchar(n)` | `string` | 限长文本 |
| `integer` | `number` | 整数 |
| `numeric` / `decimal` | `number` | 小数 |
| `boolean` | `boolean` | 布尔值 |
| `timestamp with time zone` | `string` (ISO 8601) | 时间戳 |
| `jsonb` | `Record<string, unknown>` 或具体接口 | JSON 数据 |
| `text[]` | `string[]` | 文本数组 |

### 主键和外键

```typescript
// 主键
id: string;  // UUID 格式

// 外键命名规则: {关联表}_id
user_id: string;
order_id: string;
lead_id: string;
```

### 时间戳字段

```typescript
// 必需的时间戳字段
created_at: string;  // 创建时间
updated_at: string;  // 更新时间

// 可选的时间戳字段
deleted_at?: string;  // 软删除时间
```

---

## 📁 类型文件组织

### 目录结构

```
src/
├── types/                      # 全局核心类型
│   ├── supabase.ts             # Supabase 生成的数据库类型
│   ├── api.ts                  # API 响应类型
│   └── index.ts                # 临时类型（待迁移）
│
├── shared/types/               # 跨模块共享业务类型
│   ├── user.ts                 # 用户和角色类型
│   ├── order.ts                # 订单类型
│   └── lead.ts                 # 线索类型
│
├── constants/                  # 常量和枚举
│   ├── order-status.ts         # 订单状态
│   ├── lead-status.ts          # 线索状态
│   └── measurement-status.ts   # 测量状态
│
└── features/[module]/types/    # 模块特定类型
```

### 导入规范

```typescript
// ✅ 推荐
import { UserRole } from '@/shared/types/user';
import { ORDER_STATUS, OrderStatus } from '@/constants/order-status';

// ❌ 避免
import { UserRole } from '../../../types/user';  // 相对路径
```

---

## ✅ 检查清单

开发时请确保：

- [ ] 新增角色使用 `UPPER_SNAKE_CASE` 命名
- [ ] 状态值使用 `lower_snake_case` 命名
- [ ] 所有数据库字段包含 `created_at` 和 `updated_at`
- [ ] 外键命名符合 `{table}_id` 格式
- [ ] 类型定义放置在正确的目录

---

## 📅 更新记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2024-12-16 | v1.0 | 初始版本，定义用户角色和状态类型规范 |
