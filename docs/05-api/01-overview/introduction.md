# API 概述

> L2C 系统 API 设计原则和基本概念

## 设计原则

L2C API 遵循以下设计原则：

### 1. RESTful 风格
- 使用标准 HTTP 方法：GET、POST、PUT、PATCH、DELETE
- 资源导向的 URL 设计
- 使用 HTTP 状态码表示请求结果

### 2. 统一响应格式
- 成功响应和错误响应格式统一
- 包含明确的错误码和错误信息
- 支持分页、排序、过滤

### 3. 版本管理
- API 路径包含版本号：`/api/v1/...`
- 向后兼容原则
- 废弃 API 提前通知

### 4. 安全性
- 所有请求需要认证
- 基于 Tenant 的数据隔离
- 细粒度的权限控制

## 基本概念

### 资源（Resource）
API 中的资源对应业务实体，如：
- 线索（Leads）
- 客户（Customers）
- 报价单（Quotes）
- 订单（Orders）
- 测量任务（Measure Tasks）
- 安装任务（Install Tasks）
- 采购单（Purchase Orders）
- 收款单（Payment Orders）
- 付款单（Payment Bills）

### 标识符（ID）
所有资源使用 UUID 作为唯一标识符：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 业务编号（No）
除了 ID，每个资源还有业务编号，便于业务识别：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "lead_no": "LD20260115ABC123"
}
```

编号格式：
- 线索：LD + 日期 + 随机码（如：LD20260115ABC123）
- 订单：ORD + 日期 + 随机码（如：ORD20260115ABC123）
- 报价单：QT + 日期 + 随机码（如：QT20260115ABC123）
- 测量单：MS + 日期 + 随机码（如：MS20260115ABC123）
- 安装单：INS + 日期 + 随机码（如：INS20260115ABC123）
- 采购单：PO + 日期 + 随机码（如：PO20260115ABC123）

### 多租户（Multi-Tenant）
系统支持多租户，每个租户的数据完全隔离：
- 所有请求需要携带 `Tenant-ID` 请求头
- 数据查询自动过滤租户数据
- 租户 ID 在用户登录后获取

## HTTP 方法使用规范

| 方法 | 用途 | 幂等性 | 说明 |
|------|------|--------|------|
| GET | 查询资源 | 是 | 不修改服务器状态 |
| POST | 创建资源 | 否 | 创建新资源 |
| PUT | 完整更新资源 | 是 | 替换整个资源 |
| PATCH | 部分更新资源 | 否 | 更新资源的部分字段 |
| DELETE | 删除资源 | 是 | 标记删除或物理删除 |

## URL 设计规范

### 基础路径
```
/api/v1/{resource}
```

### 资源命名
- 使用复数形式：`/api/v1/leads`
- 使用小写字母和连字符：`/api/v1/purchase-orders`
- 层级关系：`/api/v1/orders/{id}/items`

### 示例

```
GET    /api/v1/leads                    # 获取线索列表
GET    /api/v1/leads/{id}              # 获取单个线索
POST   /api/v1/leads                    # 创建线索
PUT    /api/v1/leads/{id}              # 完整更新线索
PATCH  /api/v1/leads/{id}              # 部分更新线索
DELETE /api/v1/leads/{id}              # 删除线索

GET    /api/v1/orders/{id}/items       # 获取订单项列表
POST   /api/v1/orders/{id}/split      # 订单拆单
POST   /api/v1/leads/{id}/dispatch-measure  # 预约测量
```

## 时间格式

所有时间字段使用 ISO 8601 格式：

```json
{
  "created_at": "2026-01-15T10:30:00Z",
  "scheduled_at": "2026-02-01T14:00:00+08:00"
}
```

时区说明：
- UTC 时间：以 `Z` 结尾
- 带时区时间：使用 `+08:00` 格式

## 货币格式

所有金额字段使用字符串类型，保留两位小数：

```json
{
  "total_amount": "12345.67",
  "unit_price": "99.99",
  "discount_rate": "0.9500"
}
```

## 日期格式

日期字段使用 ISO 8601 日期格式：

```json
{
  "expected_date": "2026-02-01",
  "actual_date": "2026-02-01"
}
```

## 枚举值

枚举值使用大写字母和下划线：

```json
{
  "status": "PENDING_ASSIGNMENT",
  "intention_level": "HIGH",
  "settlement_type": "PREPAID"
}
```

## 布尔值

布尔值使用小写：

```json
{
  "is_active": true,
  "is_locked": false
}
```

## 数组

数组字段使用 JSON 数组：

```json
{
  "tags": ["VIP", "老客户"],
  "items": [
    { "id": "1", "name": "商品1" },
    { "id": "2", "name": "商品2" }
  ]
}
```

## 对象

嵌套对象使用 JSON 对象：

```json
{
  "customer": {
    "id": "uuid",
    "name": "张三",
    "phone": "13800138000"
  }
}
```

## 空值

空值使用 `null`：

```json
{
  "completed_at": null,
  "deleted_at": null
}
```

## 批量操作

支持批量操作的接口使用数组参数：

```json
POST /api/v1/leads/batch-assign
{
  "lead_ids": ["uuid1", "uuid2", "uuid3"],
  "assigned_sales_id": "uuid"
}
```

## 异步操作

耗时操作支持异步处理：

```json
POST /api/v1/orders/{id}/split
{
  "async": true
}

Response:
{
  "success": true,
  "data": {
    "task_id": "task_uuid",
    "status": "PROCESSING"
  }
}
```

## 查询任务状态

异步操作完成后可以通过任务 ID 查询结果：

```
GET /api/v1/tasks/{task_id}
```

## Webhook 回调

异步操作完成后可以通过 Webhook 回调通知：

```json
{
  "event": "order.split.completed",
  "data": {
    "order_id": "uuid",
    "result": { ... }
  },
  "timestamp": "2026-01-15T10:30:00Z"
}
```

## 限流

API 限流规则：
- 每个租户：1000 请求/分钟
- 每个用户：100 请求/分钟
- 超过限制返回 429 状态码

## 缓存

部分查询接口支持缓存：
- 使用 `Cache-Control` 响应头
- 客户端可以使用 `ETag` 进行条件请求

## 请求日志

所有 API 请求会被记录，包括：
- 请求时间
- 请求方法
- 请求路径
- 请求参数
- 响应状态码
- 响应时间
- 用户 ID
- 租户 ID

## 审计日志

关键操作会被记录审计日志：
- 创建、更新、删除操作
- 状态变更操作
- 财务相关操作
- 权限变更操作

## 数据导出

支持数据导出功能：

```
GET /api/v1/leads/export?format=excel
GET /api/v1/leads/export?format=pdf
```

## 数据导入

支持数据导入功能：

```
POST /api/v1/leads/import
Content-Type: multipart/form-data

file: leads.xlsx
```

## API 健康检查

```
GET /api/health
```

响应：

```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00Z",
  "version": "1.0.0"
}
```
