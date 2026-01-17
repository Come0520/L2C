# L2C API 文档

> L2C 系统核心 API 接口文档

## 文档目录

### 快速开始
- [API 概述](./01-overview/introduction.md) - API 设计原则和基本概念
- [认证机制](./01-overview/authentication.md) - 认证方式和权限管理
- [通用规范](./01-overview/conventions.md) - 请求/响应格式、分页、过滤等
- [错误处理](./01-overview/error-handling.md) - 错误码和异常处理

### 核心业务模块
- [线索模块](./02-modules/leads.md) - 线索管理、智能查重、自动分配
- [客户模块](./02-modules/customers.md) - 客户管理、客户等级、客户合并
- [报价单模块](./02-modules/quotes.md) - 报价单创建、版本管理、转订单
- [订单模块](./02-modules/orders.md) - 订单管理、智能拆单、状态流转
- [测量模块](./02-modules/measurement.md) - 测量任务派单、数据提交、确认
- [安装模块](./02-modules/installation.md) - 安装任务派单、完成、验收
- [供应链模块](./02-modules/supply-chain.md) - 供应商、采购单、库存、加工
- [财务模块](./02-modules/finance.md) - 收款、付款、对账、佣金
- [商品模块](./02-modules/products.md) - 商品管理、价格、供应商关联
- [渠道模块](./02-modules/channels.md) - 渠道管理、结算规则、佣金
- [售后模块](./02-modules/after-sales.md) - 售后工单、定责、费用
- [审批模块](./02-modules/approval.md) - 审批流程、审批处理
- [用户和角色](./02-modules/users-roles.md) - 用户管理、角色管理、权限管理

### 移动端 API
- [移动端认证](./03-mobile/auth.md) - 登录、登出、Token 刷新
- [移动端任务](./03-mobile/tasks.md) - 任务列表、任务详情、任务完成
- [移动端数据同步](./03-mobile/data-sync.md) - 数据同步、离线上传

### 参考文档
- [数据模型](./04-reference/data-models.md) - 所有数据模型定义和说明
- [枚举值](./04-reference/enums.md) - 所有枚举值定义和说明
- [状态码](./04-reference/status-codes.md) - 所有状态码参考

### 核心业务流程 API
- [核心 API 接口定义](./api_specification.md) - 核心业务流程的 API 接口汇总

## API 版本

当前版本：`v1`

所有 API 请求的基础路径为：`/api/v1`

## 认证方式

所有 API 请求需要在请求头中携带认证信息：

```
Authorization: Bearer {token}
Tenant-ID: {tenant_id}
```

## 快速示例

### 创建线索

```bash
POST /api/v1/leads
Authorization: Bearer {token}
Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "customer_phone": "13800138000",
  "community": "阳光小区",
  "address": "1栋201",
  "channel_id": "uuid",
  "decoration_progress": "WATER_ELECTRIC"
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lead_no": "LD20260115ABC123",
    "is_duplicate": false,
    "assigned_sales_id": "uuid"
  }
}
```

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  }
}
```

## 分页参数

所有列表接口支持分页：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20，最大 100 |

## 排序参数

支持按字段排序：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sortBy | string | 否 | 排序字段 |
| sortOrder | string | 否 | 排序方向：asc 或 desc，默认 desc |

## 过滤参数

支持按字段过滤：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态过滤 |
| startDate | string | 否 | 开始日期（ISO 8601） |
| endDate | string | 否 | 结束日期（ISO 8601） |

## 变更日志

### v1.0.0 (2026-01-15)
- 初始版本发布
- 核心业务模块 API 完成
- 移动端 API 完成

## 技术支持

如有问题，请联系技术团队。
