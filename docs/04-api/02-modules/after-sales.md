# 售后模块 API

> 售后模块提供售后工单管理、定责单管理、售后统计等功能，支持售后全流程管理。

## 概述

售后模块是 L2C 系统的核心模块之一，负责管理所有售后相关信息。系统支持售后工单管理、定责单管理、售后统计、售后结算等功能。

### 核心功能

- 售后工单管理（创建、查询、更新、关闭）
- 定责单管理（创建、确认、取消）
- 售后统计
- 售后结算
- 售后退款
- 售后换货

---

## 1. 创建售后工单

创建新售后工单。

### 接口信息
- **URL**: `POST /api/v1/after-sales/tickets`
- **认证**: 需要
- **权限**: `after_sales.create`

### 请求参数

```json
{
  "orderId": "uuid",
  "type": "REPAIR",
  "description": "窗帘安装后出现褶皱",
  "photos": [
    "https://oss.example.com/photo1.jpg",
    "https://oss.example.com/photo2.jpg"
  ],
  "priority": "HIGH",
  "assignedTo": "uuid"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 是 | 关联订单 ID |
| type | string | 是 | 售后类型：REPAIR/RETURN/COMPLAINT |
| description | string | 是 | 问题描述 |
| photos | array | 否 | 问题照片 URL 数组 |
| priority | string | 否 | 优先级：HIGH/MEDIUM/LOW，默认 MEDIUM |
| assignedTo | string | 否 | 分配给的用户 ID |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "ticketNo": "AS2026011500001",
    "orderId": "uuid",
    "customerId": "uuid",
    "type": "REPAIR",
    "description": "窗帘安装后出现褶皱",
    "photos": [
      "https://oss.example.com/photo1.jpg",
      "https://oss.example.com/photo2.jpg"
    ],
    "priority": "HIGH",
    "status": "PENDING",
    "assignedTo": "uuid",
    "actualDeduction": "0",
    "createdBy": "uuid",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  },
  "message": "售后工单创建成功"
}
```

### 业务规则

1. **工单编号**：系统自动生成工单编号（格式：AS + 时间戳）
2. **初始状态**：新工单默认为待处理状态
3. **订单验证**：关联订单必须存在且属于当前租户
4. **自动扣款**：初始扣款金额为 0

---

## 2. 查询售后工单列表

分页查询售后工单列表，支持多条件筛选和搜索。

### 接口信息
- **URL**: `GET /api/v1/after-sales/tickets`
- **认证**: 需要
- **权限**: `after_sales.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 10 |
| status | string | 否 | 工单状态：PENDING/IN_PROGRESS/RESOLVED/CLOSED |
| type | string | 否 | 售后类型：REPAIR/RETURN/COMPLAINT |
| priority | string | 否 | 优先级：HIGH/MEDIUM/LOW |
| customerId | string | 否 | 客户 ID |
| orderId | string | 否 | 订单 ID |
| assignedTo | string | 否 | 分配给的用户 ID |
| search | string | 否 | 搜索关键词（工单编号/客户姓名） |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ticketNo": "AS2026011500001",
      "orderId": "uuid",
      "orderNo": "ORD2026011500001",
      "customerId": "uuid",
      "customerName": "张三",
      "type": "REPAIR",
      "description": "窗帘安装后出现褶皱",
      "priority": "HIGH",
      "status": "PENDING",
      "assignedTo": "uuid",
      "assigneeName": "李四",
      "actualDeduction": "0",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

## 3. 查询售后工单详情

根据工单 ID 查询售后工单详细信息。

### 接口信息
- **URL**: `GET /api/v1/after-sales/tickets/{id}`
- **认证**: 需要
- **权限**: `after_sales.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 工单 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "ticketNo": "AS2026011500001",
    "orderId": "uuid",
    "orderNo": "ORD2026011500001",
    "customerId": "uuid",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "type": "REPAIR",
    "description": "窗帘安装后出现褶皱",
    "photos": [
      "https://oss.example.com/photo1.jpg",
      "https://oss.example.com/photo2.jpg"
    ],
    "priority": "HIGH",
    "status": "PENDING",
    "assignedTo": "uuid",
    "assigneeName": "李四",
    "assigneePhone": "13800138001",
    "actualDeduction": "0",
    "resolution": null,
    "closedAt": null,
    "createdBy": "uuid",
    "creatorName": "王五",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z",
    "order": {
      "id": "uuid",
      "orderNo": "ORD2026011500001",
      "totalAmount": "5000.00",
      "status": "COMPLETED"
    },
    "installTask": {
      "id": "uuid",
      "taskNo": "IT2026011500001",
      "status": "COMPLETED",
      "completedAt": "2026-01-14T10:00:00Z"
    },
    "notices": [
      {
        "id": "uuid",
        "noticeNo": "LN2026011500001",
        "liablePartyType": "INSTALLER",
        "liablePartyName": "李四",
        "reason": "安装不当",
        "amount": "500.00",
        "status": "CONFIRMED",
        "confirmedAt": "2026-01-15T11:00:00Z",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

## 4. 更新售后工单

更新售后工单信息。

### 接口信息
- **URL**: `PUT /api/v1/after-sales/tickets/{id}`
- **认证**: 需要
- **权限**: `after_sales.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 工单 ID |

### 请求参数

```json
{
  "description": "窗帘安装后出现褶皱，需要重新调整",
  "priority": "HIGH",
  "assignedTo": "uuid"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| description | string | 否 | 问题描述 |
| priority | string | 否 | 优先级：HIGH/MEDIUM/LOW |
| assignedTo | string | 否 | 分配给的用户 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketNo": "AS2026011500001",
    "description": "窗帘安装后出现褶皱，需要重新调整",
    "priority": "HIGH",
    "assignedTo": "uuid",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 5. 更新售后工单状态

更新售后工单状态。

### 接口信息
- **URL**: `PUT /api/v1/after-sales/tickets/{id}/status`
- **认证**: 需要
- **权限**: `after_sales.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 工单 ID |

### 请求参数

```json
{
  "status": "IN_PROGRESS",
  "resolution": "已安排师傅上门处理"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 工单状态：PENDING/IN_PROGRESS/RESOLVED/CLOSED |
| resolution | string | 否 | 处理方案 |

### 响应示例

```json
{
  "success": true,
  "message": "状态更新成功"
}
```

### 业务规则

1. **状态流转**：PENDING -> IN_PROGRESS -> RESOLVED -> CLOSED
2. **关闭工单**：关闭工单时必须提供处理方案
3. **自动时间**：关闭工单时自动记录关闭时间

---

## 6. 分配售后工单

分配售后工单给指定人员。

### 接口信息
- **URL**: `PUT /api/v1/after-sales/tickets/{id}/assign`
- **认证**: 需要
- **权限**: `after_sales.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 工单 ID |

### 请求参数

```json
{
  "assignedTo": "uuid",
  "remark": "请尽快处理"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| assignedTo | string | 是 | 分配给的用户 ID |
| remark | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketNo": "AS2026011500001",
    "assignedTo": "uuid",
    "assigneeName": "李四",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 7. 创建定责单

创建定责单。

### 接口信息
- **URL**: `POST /api/v1/after-sales/notices`
- **认证**: 需要
- **权限**: `after_sales.create`

### 请求参数

```json
{
  "afterSalesId": "uuid",
  "liablePartyType": "INSTALLER",
  "liablePartyId": "uuid",
  "reason": "安装不当导致窗帘褶皱",
  "liabilityReasonCategory": "INSTALLATION_ERROR",
  "amount": 500,
  "evidencePhotos": [
    "https://oss.example.com/evidence1.jpg"
  ],
  "sourcePurchaseOrderId": "uuid",
  "sourceInstallTaskId": "uuid"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| afterSalesId | string | 是 | 售后工单 ID |
| liablePartyType | string | 是 | 责任方类型：COMPANY/FACTORY/INSTALLER/MEASURER/LOGISTICS/CUSTOMER |
| liablePartyId | string | 否 | 责任方 ID |
| reason | string | 是 | 定责原因 |
| liabilityReasonCategory | string | 否 | 定责原因分类 |
| amount | number | 是 | 责任金额 |
| evidencePhotos | array | 否 | 证据照片 URL 数组 |
| sourcePurchaseOrderId | string | 否 | 源采购单 ID |
| sourceInstallTaskId | string | 否 | 源安装任务 ID |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "noticeNo": "LN2026011500001",
    "afterSalesId": "uuid",
    "liablePartyType": "INSTALLER",
    "liablePartyId": "uuid",
    "reason": "安装不当导致窗帘褶皱",
    "liabilityReasonCategory": "INSTALLATION_ERROR",
    "amount": "500.00",
    "evidencePhotos": [
      "https://oss.example.com/evidence1.jpg"
    ],
    "sourcePurchaseOrderId": "uuid",
    "sourceInstallTaskId": "uuid",
    "status": "DRAFT",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  },
  "message": "定责单创建成功"
}
```

### 业务规则

1. **定责编号**：系统自动生成定责编号（格式：LN + 时间戳）
2. **初始状态**：新定责单默认为草稿状态
3. **责任金额**：责任金额必须大于等于 0
4. **追溯性**：支持追溯采购单和安装任务

---

## 8. 确认定责单

确认定责单。

### 接口信息
- **URL**: `PUT /api/v1/after-sales/notices/{id}/confirm`
- **认证**: 需要
- **权限**: `after_sales.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 定责单 ID |

### 响应示例

```json
{
  "success": true,
  "message": "定责单已确认，工单扣款金额已更新"
}
```

### 业务规则

1. **状态限制**：只有草稿状态的定责单可以确认
2. **自动扣款**：确认定责单后，自动更新工单的扣款金额
3. **记录确认人**：记录确认人和确认时间

---

## 9. 取消定责单

取消定责单。

### 接口信息
- **URL**: `PUT /api/v1/after-sales/notices/{id}/cancel`
- **认证**: 需要
- **权限**: `after_sales.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 定责单 ID |

### 请求参数

```json
{
  "reason": "定责有误，需要重新评估"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 取消原因 |

### 响应示例

```json
{
  "success": true,
  "message": "定责单已取消，工单扣款金额已更新"
}
```

### 业务规则

1. **状态限制**：只有草稿状态的定责单可以取消
2. **自动扣款**：取消定责单后，自动更新工单的扣款金额

---

## 10. 查询定责单列表

查询售后工单的定责单列表。

### 接口信息
- **URL**: `GET /api/v1/after-sales/tickets/{id}/notices`
- **认证**: 需要
- **权限**: `after_sales.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 售后工单 ID |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 定责单状态：DRAFT/CONFIRMED/CANCELLED |
| liablePartyType | string | 否 | 责任方类型 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "noticeNo": "LN2026011500001",
      "liablePartyType": "INSTALLER",
      "liablePartyId": "uuid",
      "liablePartyName": "李四",
      "reason": "安装不当导致窗帘褶皱",
      "liabilityReasonCategory": "INSTALLATION_ERROR",
      "amount": "500.00",
      "status": "CONFIRMED",
      "confirmedAt": "2026-01-15T11:00:00Z",
      "confirmedBy": "uuid",
      "confirmerName": "王五",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 11. 售后退款

处理售后退款。

### 接口信息
- **URL**: `POST /api/v1/after-sales/tickets/{id}/refund`
- **认证**: 需要
- **权限**: `after_sales.refund`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 售后工单 ID |

### 请求参数

```json
{
  "refundAmount": 500,
  "refundReason": "质量问题",
  "refundMethod": "BANK_TRANSFER",
  "bankInfo": {
    "bankName": "工商银行",
    "accountNumber": "6222021234567890",
    "accountHolder": "张三"
  },
  "remark": "客户要求退款"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refundAmount | number | 是 | 退款金额 |
| refundReason | string | 是 | 退款原因 |
| refundMethod | string | 是 | 退款方式：BANK_TRANSFER/CASH/ALIPAY/WECHAT |
| bankInfo | object | 否 | 银行信息 |
| remark | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketId": "uuid",
    "ticketNo": "AS2026011500001",
    "refundAmount": "500.00",
    "refundReason": "质量问题",
    "refundMethod": "BANK_TRANSFER",
    "bankInfo": {
      "bankName": "工商银行",
      "accountNumber": "6222021234567890",
      "accountHolder": "张三"
    },
    "status": "PENDING",
    "remark": "客户要求退款",
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **退款金额**：退款金额不能超过订单金额
2. **退款方式**：根据客户选择的退款方式处理
3. **退款状态**：退款单创建后需要财务审核

---

## 12. 售后换货

处理售后换货。

### 接口信息
- **URL**: `POST /api/v1/after-sales/tickets/{id}/exchange`
- **认证**: 需要
- **权限**: `after_sales.exchange`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 售后工单 ID |

### 请求参数

```json
{
  "exchangeItems": [
    {
      "productId": "uuid",
      "productName": "窗帘",
      "sku": "CL001",
      "quantity": 1,
      "reason": "质量问题"
    }
  ],
  "remark": "客户要求换货"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| exchangeItems | array | 是 | 换货商品数组 |
| remark | string | 否 | 备注 |

### exchangeItems 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 是 | 商品 ID |
| productName | string | 是 | 商品名称 |
| sku | string | 是 | 商品 SKU |
| quantity | integer | 是 | 换货数量 |
| reason | string | 是 | 换货原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketId": "uuid",
    "ticketNo": "AS2026011500001",
    "exchangeItems": [
      {
        "productId": "uuid",
        "productName": "窗帘",
        "sku": "CL001",
        "quantity": 1,
        "reason": "质量问题"
      }
    ],
    "status": "PENDING",
    "remark": "客户要求换货",
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 13. 售后统计

获取售后统计数据。

### 接口信息
- **URL**: `GET /api/v1/after-sales/statistics`
- **认证**: 需要
- **权限**: `after_sales.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "totalTickets": 100,
    "pendingTickets": 20,
    "inProgressTickets": 30,
    "resolvedTickets": 40,
    "closedTickets": 10,
    "totalRefundAmount": "10000.00",
    "totalDeductionAmount": "5000.00",
    "typeDistribution": {
      "REPAIR": 50,
      "RETURN": 30,
      "COMPLAINT": 20
    },
    "priorityDistribution": {
      "HIGH": 20,
      "MEDIUM": 60,
      "LOW": 20
    },
    "liablePartyDistribution": {
      "COMPANY": 10,
      "FACTORY": 20,
      "INSTALLER": 30,
      "MEASURER": 15,
      "LOGISTICS": 10,
      "CUSTOMER": 15
    },
    "monthlyStats": [
      {
        "month": "2026-01",
        "tickets": 50,
        "refunds": "5000.00",
        "deductions": "2500.00"
      }
    ]
  }
}
```

---

## 14. 售后工单详情统计

获取售后工单的详细统计信息。

### 接口信息
- **URL**: `GET /api/v1/after-sales/tickets/{id}/statistics`
- **认证**: 需要
- **权限**: `after_sales.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 售后工单 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "ticketId": "uuid",
    "ticketNo": "AS2026011500001",
    "orderNo": "ORD2026011500001",
    "totalDeduction": "500.00",
    "confirmedDeduction": "500.00",
    "pendingDeduction": "0",
    "noticesCount": 1,
    "confirmedNoticesCount": 1,
    "pendingNoticesCount": 0,
    "liableParties": [
      {
        "liablePartyType": "INSTALLER",
        "liablePartyName": "李四",
        "amount": "500.00",
        "noticesCount": 1
      }
    ],
    "timeline": [
      {
        "action": "创建工单",
        "operator": "王五",
        "createdAt": "2026-01-15T10:00:00Z"
      },
      {
        "action": "创建定责单",
        "operator": "王五",
        "createdAt": "2026-01-15T10:30:00Z"
      },
      {
        "action": "确认定责单",
        "operator": "王五",
        "createdAt": "2026-01-15T11:00:00Z"
      }
    ]
  }
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| AFTER_SALES_TICKET_NOT_FOUND | 404 | 售后工单不存在 |
| AFTER_SALES_TICKET_ALREADY_EXISTS | 409 | 售后工单已存在 |
| AFTER_SALES_TICKET_CANNOT_DELETE | 422 | 售后工单不能删除 |
| AFTER_SALES_TICKET_INVALID_STATUS | 400 | 售后工单状态无效 |
| AFTER_SALES_TICKET_INVALID_TYPE | 400 | 售后类型无效 |
| AFTER_SALES_TICKET_INVALID_PRIORITY | 400 | 优先级无效 |
| LIABILITY_NOTICE_NOT_FOUND | 404 | 定责单不存在 |
| LIABILITY_NOTICE_ALREADY_EXISTS | 409 | 定责单已存在 |
| LIABILITY_NOTICE_CANNOT_CONFIRM | 422 | 定责单不能确认 |
| LIABILITY_NOTICE_INVALID_STATUS | 400 | 定责单状态无效 |
| LIABILITY_NOTICE_INVALID_PARTY_TYPE | 400 | 责任方类型无效 |
| REFUND_AMOUNT_INVALID | 400 | 退款金额无效 |
| REFUND_AMOUNT_EXCEEDS_ORDER | 400 | 退款金额超过订单金额 |
| EXCHANGE_ITEM_INVALID | 400 | 换货商品无效 |

---

## 数据模型

### AfterSalesTicket

```typescript
interface AfterSalesTicket {
  id: string;
  tenantId: string;
  ticketNo: string;
  orderId: string;
  customerId: string;
  type: 'REPAIR' | 'RETURN' | 'COMPLAINT';
  description: string;
  photos?: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  actualDeduction: string;
  resolution?: string;
  closedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### LiabilityNotice

```typescript
interface LiabilityNotice {
  id: string;
  tenantId: string;
  noticeNo: string;
  afterSalesId: string;
  liablePartyType: 'COMPANY' | 'FACTORY' | 'INSTALLER' | 'MEASURER' | 'LOGISTICS' | 'CUSTOMER';
  liablePartyId?: string;
  reason: string;
  liabilityReasonCategory?: string;
  amount: string;
  evidencePhotos?: string[];
  sourcePurchaseOrderId?: string;
  sourceInstallTaskId?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  confirmedBy?: string;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### AfterSalesRefund

```typescript
interface AfterSalesRefund {
  id: string;
  tenantId: string;
  ticketId: string;
  ticketNo: string;
  refundAmount: string;
  refundReason: string;
  refundMethod: 'BANK_TRANSFER' | 'CASH' | 'ALIPAY' | 'WECHAT';
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branchName?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AfterSalesExchange

```typescript
interface AfterSalesExchange {
  id: string;
  tenantId: string;
  ticketId: string;
  ticketNo: string;
  exchangeItems: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    reason: string;
  }>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
