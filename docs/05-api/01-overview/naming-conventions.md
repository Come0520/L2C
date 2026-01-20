# API 字段命名规范

> L2C 项目 API 字段命名统一规范

## 命名风格决定

**决定采用：`camelCase`（小驼峰）**

### 选择理由

1. **前端友好**：JavaScript/TypeScript 标准命名风格
2. **Next.js 习惯**：与框架生态保持一致
3. **减少转换**：前端直接使用，无需 snake_case → camelCase 转换

## 命名规则

### 基本规则

| 规则 | 示例 |
|------|------|
| 字段名用 camelCase | `customerName`, `orderNo` |
| ID 字段后缀 Id | `customerId`, `quoteId` |
| 布尔值用 is/has/can 前缀 | `isActive`, `hasPayment`, `canEdit` |
| 日期字段用 At/Date 后缀 | `createdAt`, `dueDate` |
| 金额字段用 Amount 后缀 | `totalAmount`, `paidAmount` |

### 特殊情况

| 场景 | 规范 |
|------|------|
| 缩写词 | 全小写：`customerId` (非 `customerID`) |
| 状态枚举 | 全大写下划线：`PENDING_APPROVAL` |
| API 路径 | 小写连字符：`/after-sales` |

## 常用字段对照表

### 通用字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 主键 (UUID) |
| tenantId | string | 租户 ID |
| createdAt | string | 创建时间 (ISO 8601) |
| updatedAt | string | 更新时间 |
| createdBy | string | 创建人 ID |
| status | string | 状态枚举 |
| remark | string | 备注 |

### 业务字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| customerName | string | 客户姓名 |
| customerPhone | string | 客户电话 |
| totalAmount | string | 总金额 (decimal) |
| paidAmount | string | 已付金额 |
| pendingAmount | string | 待收金额 |
| orderNo | string | 订单编号 |
| quoteNo | string | 报价单编号 |

### 关联字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| customerId | string | 客户 ID |
| orderId | string | 订单 ID |
| quoteId | string | 报价单 ID |
| salesId | string | 销售 ID |
| workerId | string | 工人 ID |

## 响应结构规范

### 成功响应

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260120001",
    "customerId": "uuid",
    "customerName": "张三",
    "totalAmount": "10000.00",
    "createdAt": "2026-01-20T10:00:00Z"
  }
}
```

### 列表响应

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数错误",
    "details": {
      "customerPhone": "手机号格式不正确"
    }
  }
}
```

## 迁移指南

如需从 snake_case 迁移到 camelCase：

1. 后端：使用 Drizzle 的 column 别名或转换函数
2. 前端：无需修改（已使用 camelCase）
3. 文档：统一更新示例代码

---

*更新日期：2026-01-20*
