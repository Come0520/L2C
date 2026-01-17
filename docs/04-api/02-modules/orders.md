# 订单模块 API

> 订单管理、智能拆单、状态流转

## 模块概述

订单模块负责管理销售订单，包括订单创建、智能拆单、状态流转、发货、安装等功能。

### 核心功能

- 报价单转订单
- 智能拆单（按供应商、商品类型）
- 订单锁定
- 订单状态流转
- 发货管理
- 安装管理

### 数据模型

#### Order（订单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |
| orderNo | string | 是 | 订单编号 |
| tenantId | uuid | 是 | 租户 ID |
| quoteId | uuid | 是 | 报价单 ID |
| quoteVersionId | uuid | 是 | 报价单版本 ID |
| leadId | uuid | 否 | 线索 ID |
| customerId | uuid | 是 | 客户 ID |
| customerName | string | 是 | 客户姓名（冗余） |
| customerPhone | string | 是 | 客户手机号（冗余） |
| deliveryAddress | text | 否 | 送货地址 |
| totalAmount | decimal | 是 | 订单总金额 |
| paidAmount | decimal | 是 | 已付金额 |
| balanceAmount | decimal | 是 | 欠款金额 |
| settlementType | string | 是 | 结算类型：PREPAID/CREDIT/CASH |
| confirmationImg | text | 否 | 确认凭证（赊销客户） |
| paymentProofImg | text | 否 | 付款凭证（现结客户） |
| paymentAmount | decimal | 否 | 立即支付金额 |
| paymentMethod | string | 否 | 支付方式：CASH/WECHAT/ALIPAY/BANK |
| paymentTime | timestamp | 否 | 支付时间 |
| prepaidPaymentId | uuid | 否 | 预收款单 ID |
| status | string | 是 | 订单状态 |
| snapshotData | jsonb | 是 | 订单快照数据（存储下单时刻的 Quote 完整数据、Customer 基础信息） |
| snapshotCreatedAt | timestamp | 是 | 快照创建时间 |
| isLocked | boolean | 是 | 是否锁定 |
| lockedAt | timestamp | 否 | 锁定时间 |
| salesId | uuid | 否 | 销售人员 ID |
| remark | text | 否 | 备注 |
| createdBy | uuid | 是 | 创建人 ID |
| createdAt | timestamp | 是 | 创建时间 |
| updatedAt | timestamp | 是 | 更新时间 |
| completedAt | timestamp | 否 | 完成时间 |
| closedAt | timestamp | 否 | 关闭时间 |
| deletedAt | timestamp | 否 | 删除时间 |

#### OrderItem（订单项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单项 ID |
| tenantId | uuid | 是 | 租户 ID |
| orderId | uuid | 是 | 订单 ID |
| quoteItemId | uuid | 是 | 报价单项 ID |
| roomName | string | 是 | 房间名称 |
| productId | uuid | 是 | 商品 ID |
| productName | string | 是 | 商品名称 |
| category | string | 是 | 商品分类 |
| quantity | decimal | 是 | 数量 |
| width | decimal | 否 | 宽度 |
| height | decimal | 否 | 高度 |
| unitPrice | decimal | 是 | 单价 |
| subtotal | decimal | 是 | 小计 |
| poId | uuid | 否 | 采购单 ID |
| supplierId | uuid | 否 | 供应商 ID |
| status | string | 是 | 状态 |
| remark | text | 否 | 备注 |
| sortOrder | integer | 否 | 排序 |
| createdAt | timestamp | 是 | 创建时间 |

#### PaymentSchedule（付款计划）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 付款计划 ID |
| tenantId | uuid | 是 | 租户 ID |
| orderId | uuid | 是 | 订单 ID |
| statementId | uuid | 否 | 对账单 ID |
| name | string | 是 | 名称（预付款、尾款等） |
| amount | decimal | 是 | 金额 |
| expectedDate | date | 否 | 预期日期 |
| actualDate | date | 否 | 实际日期 |
| status | string | 是 | 状态：PENDING/PAID |
| proofImg | text | 否 | 凭证图片 |
| createdAt | timestamp | 是 | 创建时间 |
| updatedAt | timestamp | 是 | 更新时间 |

## API 接口

### 1. 创建订单

将报价单转为订单。

#### 接口信息

- **URL**: `POST /api/v1/orders`
- **认证**: 需要
- **权限**: `orders.create`

#### 请求参数

```json
{
  "quoteId": "uuid",
  "settlementType": "PREPAID",
  "paymentProofImg": "https://oss.example.com/payment.jpg",
  "relatedPaymentId": "uuid",
  "paymentAmount": "30000.00",
  "paymentMethod": "WECHAT",
  "confirmationImg": "https://oss.example.com/confirmation.jpg",
  "remark": "客户要求尽快发货"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| quoteId | string | 是 | 报价单 ID |
| settlementType | string | 是 | 结算类型：PREPAID/CREDIT/CASH |
| paymentProofImg | string | 否 | 付款凭证（现结客户必填） |
| relatedPaymentId | string | 否 | 预收款单 ID（预付客户必填） |
| paymentAmount | string | 否 | 立即支付金额 |
| paymentMethod | string | 否 | 支付方式：CASH/WECHAT/ALIPAY/BANK |
| confirmationImg | string | 否 | 确认凭证（赊销客户必填） |
| remark | text | 否 | 备注 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "quoteId": "uuid",
    "quoteNo": "QT20260110DEF456",
    "customerId": "uuid",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "totalAmount": "50000.00",
    "paidAmount": "30000.00",
    "balanceAmount": "20000.00",
    "settlementType": "PREPAID",
    "paymentProofImg": "https://oss.example.com/payment.jpg",
    "paymentAmount": "30000.00",
    "paymentMethod": "WECHAT",
    "paymentTime": "2026-01-15T10:30:00Z",
    "status": "PENDING_PO",
    "isLocked": false,
    "salesId": "uuid",
    "salesName": "李四",
    "remark": "客户要求尽快发货",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

#### 业务规则

1. **报价单状态**：
   - 报价单必须为 WON 状态
   - 报价单未转订单

2. **结算类型**：
   - PREPAID（预付）：使用预收款单
   - CREDIT（赊销）：需要确认凭证
   - CASH（现结）：需要付款凭证

3. **付款比例**：
   - 预付款比例不低于 50%
   - 尾款在发货前付清

### 2. 查询订单列表

查询订单列表，支持分页、排序、过滤。

#### 接口信息

- **URL**: `GET /api/v1/orders`
- **认证**: 需要
- **权限**: `orders.read`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| sortBy | string | 否 | 排序字段，默认 createdAt |
| sortOrder | string | 否 | 排序方向，默认 desc |
| status | string | 否 | 状态过滤 |
| customerId | string | 否 | 客户 ID |
| salesId | string | 否 | 销售人员 ID |
| settlementType | string | 否 | 结算类型 |
| startDate | string | 否 | 开始日期（ISO 8601） |
| endDate | string | 否 | 结束日期（ISO 8601） |
| keyword | string | 否 | 关键词搜索 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderNo": "ORD20260115ABC123",
        "customerName": "张三",
        "customerPhone": "13800138000",
        "totalAmount": "50000.00",
        "paidAmount": "30000.00",
        "balanceAmount": "20000.00",
        "status": "PENDING_PO",
        "settlementType": "PREPAID",
        "salesName": "李四",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 3. 查询订单详情

查询单个订单的详细信息。

#### 接口信息

- **URL**: `GET /api/v1/orders/{id}`
- **认证**: 需要
- **权限**: `orders.read`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "quoteId": "uuid",
    "quoteNo": "QT20260110DEF456",
    "leadId": "uuid",
    "leadNo": "LD20260105GHI789",
    "customerId": "uuid",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "deliveryAddress": "阳光小区1栋201",
    "totalAmount": "50000.00",
    "paidAmount": "30000.00",
    "balanceAmount": "20000.00",
    "settlementType": "PREPAID",
    "paymentProofImg": "https://oss.example.com/payment.jpg",
    "paymentAmount": "30000.00",
    "paymentMethod": "WECHAT",
    "paymentTime": "2026-01-15T10:30:00Z",
    "prepaidPaymentId": "uuid",
    "prepaidPaymentNo": "PAY20260110JKL012",
    "status": "PENDING_PO",
    "isLocked": false,
    "salesId": "uuid",
    "salesName": "李四",
    "remark": "客户要求尽快发货",
    "createdBy": "uuid",
    "createdByName": "李四",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:30:00Z",
    "items": [
      {
        "id": "uuid",
        "orderId": "uuid",
        "quoteItemId": "uuid",
        "roomName": "客厅",
        "productId": "uuid",
        "productName": "窗帘面料-001",
        "category": "CURTAIN_FABRIC",
        "quantity": "10.00",
        "width": "3000.00",
        "height": "2800.00",
        "unitPrice": "200.00",
        "subtotal": "2000.00",
        "poId": "uuid",
        "poNo": "PO20260115MNO345",
        "supplierId": "uuid",
        "supplierName": "供应商A",
        "status": "PO_CONFIRMED",
        "remark": "定制尺寸",
        "sortOrder": 1,
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "paymentSchedules": [
      {
        "id": "uuid",
        "orderId": "uuid",
        "name": "预付款",
        "amount": "30000.00",
        "expectedDate": "2026-01-15",
        "actualDate": "2026-01-15",
        "status": "PAID",
        "proofImg": "https://oss.example.com/payment.jpg",
        "createdAt": "2026-01-15T10:00:00Z"
      },
      {
        "id": "uuid",
        "orderId": "uuid",
        "name": "尾款",
        "amount": "20000.00",
        "expectedDate": "2026-02-01",
        "status": "PENDING",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

### 4. 更新订单

更新订单信息。

#### 接口信息

- **URL**: `PATCH /api/v1/orders/{id}`
- **认证**: 需要
- **权限**: `orders.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "deliveryAddress": "阳光小区1栋201（新地址）",
  "remark": "客户更改送货地址"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "deliveryAddress": "阳光小区1栋201（新地址）",
    "remark": "客户更改送货地址",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 5. 锁定订单

锁定订单，防止修改。

#### 接口信息

- **URL**: `POST /api/v1/orders/{id}/lock`
- **认证**: 需要
- **权限**: `orders.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "reason": "准备拆单，锁定订单"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "isLocked": true,
    "lockedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 6. 解锁订单

解锁订单，允许修改。

#### 接口信息

- **URL**: `POST /api/v1/orders/{id}/unlock`
- **认证**: 需要
- **权限**: `orders.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "reason": "客户要求修改订单"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "isLocked": false,
    "lockedAt": null
  }
}
```

### 7. 智能拆单

触发/预览拆单结果。

#### 接口信息

- **URL**: `POST /api/v1/orders/{id}/split`
- **认证**: 需要
- **权限**: `orders.split`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "dryRun": true,
  "splitRuleId": "uuid"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dryRun | boolean | 否 | 是否预览模式，默认 false |
| splitRuleId | string | 否 | 拆单规则 ID |

#### 响应示例（预览模式）

```json
{
  "success": true,
  "data": {
    "preview": [
      {
        "type": "FINISHED",
        "supplierId": "uuid",
        "supplierName": "供应商A",
        "items": [
          {
            "orderItemId": "uuid",
            "productName": "窗帘成品-001",
            "quantity": "5.00",
            "amount": "10000.00"
          }
        ],
        "totalAmount": "10000.00"
      },
      {
        "type": "FABRIC",
        "supplierId": "uuid",
        "supplierName": "供应商B",
        "items": [
          {
            "orderItemId": "uuid",
            "productName": "窗帘面料-001",
            "quantity": "10.00",
            "amount": "2000.00"
          }
        ],
        "totalAmount": "2000.00"
      },
      {
        "type": "STOCK",
        "supplierId": "uuid",
        "supplierName": "内部仓库",
        "items": [
          {
            "orderItemId": "uuid",
            "productName": "窗帘配件-001",
            "quantity": "20.00",
            "amount": "500.00"
          }
        ],
        "totalAmount": "500.00"
      }
    ],
    "totalAmount": "12500.00",
    "dryRun": true
  }
}
```

#### 响应示例（实际拆单）

```json
{
  "success": true,
  "data": {
    "purchaseOrders": [
      {
        "id": "uuid",
        "poNo": "PO20260115MNO345",
        "type": "FINISHED",
        "supplierId": "uuid",
        "supplierName": "供应商A",
        "status": "DRAFT",
        "totalAmount": "10000.00"
      }
    ],
    "workOrders": [
      {
        "id": "uuid",
        "woNo": "WO20260115PQR678",
        "supplierId": "uuid",
        "supplierName": "供应商B",
        "status": "PENDING",
        "totalAmount": "2000.00"
      }
    ],
    "stockItems": [
      {
        "orderItemId": "uuid",
        "productName": "窗帘配件-001",
        "quantity": "20.00",
        "amount": "500.00"
      }
    ],
    "orderStatus": "PENDING_PRODUCTION",
    "splitAt": "2026-01-15T11:00:00Z"
  }
}
```

### 8. 确认拆单

确认拆单结果，可以人工调整。

#### 接口信息

- **URL**: `POST /api/v1/orders/{id}/confirm-split`
- **认证**: 需要
- **权限**: `orders.split`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "adjustments": [
    {
      "itemId": "uuid",
      "targetSupplierId": "uuid",
      "reason": "更换供应商"
    }
  ],
  "remark": "人工调整拆单结果"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| adjustments | array | 否 | 调整项 |
| adjustments[].itemId | string | 是 | 订单项 ID |
| adjustments[].targetSupplierId | string | 是 | 目标供应商 ID |
| adjustments[].reason | string | 否 | 调整原因 |
| remark | text | 否 | 备注 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNo": "ORD20260115ABC123",
    "status": "PENDING_PRODUCTION",
    "confirmedAt": "2026-01-15T11:00:00Z",
    "adjustmentsApplied": 1
  }
}
```

### 9. 申请发货

申请订单发货。

#### 接口信息

- **URL**: `POST /api/v1/orders/{id}/request-shipment`
- **认证**: 需要
- **权限**: `orders.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "requestedShipmentDate": "2026-02-01",
  "remark": "客户要求尽快发货"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "status": "DISPATCHING",
    "requestedShipmentDate": "2026-02-01",
    "requestedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 10. 确认发货

确认订单发货。

#### 接口信息

- **URL**: `POST /api/v1/orders/{id}/confirm-shipment`
- **认证**: 需要
- **权限**: `orders.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "logisticsCompany": "顺丰速运",
  "trackingNumber": "SF1234567890",
  "shippedAt": "2026-02-01T10:00:00Z",
  "remark": "已发货"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "status": "SHIPPED",
    "logisticsCompany": "顺丰速运",
    "trackingNumber": "SF1234567890",
    "shippedAt": "2026-02-01T10:00:00Z"
  }
}
```

### 11. 取消订单

取消订单。

#### 接口信息

- **URL**: `POST /api/v1/orders/{id}/cancel`
- **认证**: 需要
- **权限**: `orders.cancel`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "reason": "客户取消订单",
  "verificationCode": "123456"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "status": "CANCELLED",
    "cancelledAt": "2026-01-15T11:00:00Z",
    "cancelReason": "客户取消订单"
  }
}
```

### 13. 查询物流轨迹

查询订单的物流轨迹信息。

#### 接口信息

- **URL**: `GET /api/v1/orders/{id}/logistics-tracking`
- **认证**: 需要
- **权限**: `orders.read`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "trackingNumber": "SF1234567890",
    "company": "SF",
    "companyName": "顺丰速运",
    "status": "运输中",
    "timeline": [
      {
        "time": "2026-01-22T10:00:00Z",
        "status": "已揽收",
        "location": "北京市朝阳区",
        "description": "快递员已揽收"
      },
      {
        "time": "2026-01-22T18:00:00Z",
        "status": "运输中",
        "location": "北京市大兴区",
        "description": "快件到达北京大兴集散中心"
      },
      {
        "time": "2026-01-23T09:00:00Z",
        "status": "派送中",
        "location": "上海市浦东新区",
        "description": "快件到达上海浦东集散中心，准备派送"
      }
    ],
    "estimatedDelivery": "2026-01-23T18:00:00Z"
  }
}
```

### 14. 创建变更请求

创建订单变更请求。

#### 接口信息

- **URL**: `POST /api/v1/orders/{id}/change-requests`
- **认证**: 需要
- **权限**: `orders.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数

```json
{
  "change_type": "MODIFY_ITEM",
  "change_reason": "客户要求修改尺寸",
  "original_items": [
    {
      "id": "uuid",
      "product_name": "梦幻帘",
      "quantity": 1,
      "width": 2800,
      "height": 2500,
      "subtotal": 300.00
    }
  ],
  "new_items": [
    {
      "product_id": "uuid",
      "product_name": "梦幻帘",
      "quantity": 1,
      "width": 3000,
      "height": 2500,
      "subtotal": 320.00
    }
  ]
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| change_type | string | 是 | 变更类型：ADD_ITEM/REMOVE_ITEM/MODIFY_ITEM |
| change_reason | string | 是 | 变更原因 |
| original_items | array | 是 | 原始商品列表 |
| new_items | array | 是 | 新商品列表 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_no": "OD20260101001",
    "change_type": "MODIFY_ITEM",
    "price_difference": "20.00",
    "status": "PENDING",
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

### 15. 审批变更请求

审批订单变更请求。

#### 接口信息

- **URL**: `POST /api/v1/change-requests/{id}/approve`
- **认证**: 需要
- **权限**: `orders.approve`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 变更请求 ID |

#### 请求参数

```json
{
  "approval_comment": "同意变更"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approved_at": "2026-01-15T11:00:00Z"
  }
}
```

### 16. 拒绝变更请求

拒绝订单变更请求。

#### 接口信息

- **URL**: `POST /api/v1/change-requests/{id}/reject`
- **认证**: 需要
- **权限**: `orders.approve`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 变更请求 ID |

#### 请求参数

```json
{
  "rejection_reason": "变更原因不充分"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejected_at": "2026-01-15T11:00:00Z"
  }
}
```

### 17. 订单统计

获取订单统计数据。

#### 接口信息

- **URL**: `GET /api/v1/orders/statistics`
- **认证**: 需要
- **权限**: `orders.read`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期（ISO 8601） |
| endDate | string | 否 | 结束日期（ISO 8601） |
| groupBy | string | 否 | 分组字段：status/settlementType/sales |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "total": 100,
    "totalAmount": "5000000.00",
    "paidAmount": "3000000.00",
    "balanceAmount": "2000000.00",
    "byStatus": {
      "PENDING_PO": 10,
      "IN_PRODUCTION": 30,
      "PENDING_DELIVERY": 20,
      "SHIPPED": 15,
      "COMPLETED": 25
    },
    "bySettlementType": {
      "PREPAID": 50,
      "CREDIT": 30,
      "CASH": 20
    },
    "bySales": [
      {
        "salesId": "uuid",
        "salesName": "李四",
        "count": 30,
        "amount": "1500000.00"
      }
    ]
  }
}
```

## 状态流转

### 订单状态

| 状态 | 说明 | 可转换状态 |
|------|------|-----------|
| DRAFT | 草稿 | PENDING_PO |
| PENDING_PO | 待拆单 | PENDING_CONFIRMATION, IN_PRODUCTION, CANCELLED |
| PENDING_CONFIRMATION | 待确认深化图 | IN_PRODUCTION, FABRIC_PURCHASING, CANCELLED |
| IN_PRODUCTION | 生产中 | PENDING_DELIVERY |
| FABRIC_PURCHASING | 面料采购中 | FABRIC_RECEIVED |
| FABRIC_RECEIVED | 面料入库 | PROCESSING |
| PROCESSING | 加工中 | PENDING_DELIVERY |
| PENDING_DELIVERY | 待发货 | SHIPPED |
| DISPATCHING | 发货中 | SHIPPED |
| SHIPPED | 已发货 | PENDING_INSTALL, COMPLETED |
| PENDING_INSTALL | 待安装 | COMPLETED |
| COMPLETED | 已完成 | CLOSED |
| CLOSED | 已关闭 | - |
| CANCELLED | 已取消 | - |

### 状态转换规则

1. **DRAFT → PENDING_PO**
   - 订单创建后自动转换

2. **PENDING_PO → IN_PRODUCTION**
   - 拆单完成后自动转换

3. **IN_PRODUCTION → PENDING_DELIVERY**
   - 生产完成后自动转换

4. **PENDING_DELIVERY → SHIPPED**
   - 确认发货后转换

5. **SHIPPED → PENDING_INSTALL**
   - 需要安装的订单

6. **SHIPPED → COMPLETED**
   - 不需要安装的订单

7. **PENDING_INSTALL → COMPLETED**
   - 安装完成后转换

8. **COMPLETED → CLOSED**
   - 财务结清后转换

## 业务规则

### 拆单规则

1. **拆单类型**：
   - FINISHED（成品）：直接采购成品
   - FABRIC（面料）：采购面料，加工成成品
   - STOCK（库存）：从库存出库

2. **拆单策略**：
   - 按供应商拆单
   - 按商品类型拆单
   - 按拆单规则拆单

3. **人工调整**：
   - 可以调整供应商
   - 可以调整拆单类型
   - 需要记录调整原因

### 锁定规则

1. **自动锁定**：
   - 拆单前自动锁定
   - 发货前自动锁定

2. **手动锁定**：
   - 管理员可以手动锁定
   - 需要记录锁定原因

3. **解锁规则**：
   - 未拆单前可以解锁
   - 未发货前可以解锁
   - 需要管理员权限

### 发货规则

1. **发货条件**：
   - 订单已生产完成
   - 尾款已付清（预付客户）
   - 库存充足

2. **发货流程**：
   - 销售申请发货
   - 仓库确认发货
   - 更新物流信息

## 错误码
| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| ORDER_NOT_FOUND | 404 | 订单不存在 |
| QUOTE_NOT_WON | 400 | 报价单不是WON状态 |
| QUOTE_ALREADY_CONVERTED | 400 | 报价单已转订单 |
| ORDER_ALREADY_LOCKED | 400 | 订单已锁定 |
| ORDER_NOT_LOCKED | 400 | 订单未锁定 |
| INVALID_STATUS_TRANSITION | 400 | 无效的状态转换 |
| SPLIT_FAILED | 400 | 拆单失败 |
| SHIPMENT_FAILED | 400 | 发货失败 |
| CHANGE_REQUEST_INVALID | 400 | 变更请求无效 |
| INSUFFICIENT_PERMISSION | 403 | 权限不足 |

## 新增API接口 (2026-01-16整改)

### 18. 叫停订单
暂停订单生产。

#### 接口信息
- **URL**: `POST /api/v1/orders/{id}/halt`
- **认证**: 需要
- **权限**: `orders.halt`

#### 路径参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数
```json
{
  "haltedReason": "客户要求暂停生产",
  "haltType": "FULL"
}
```

#### 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| haltedReason | string | 是 | 叫停原因 |
| haltType | string | 是 | 叫停类型：FULL(整单)/PARTIAL(商品行) |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "previousStatus": "IN_PRODUCTION",
    "status": "HALTED",
    "haltedReason": "客户要求暂停生产",
    "haltedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 19. 恢复订单
恢复暂停的订单。

#### 接口信息
- **URL**: `POST /api/v1/orders/{id}/resume`
- **认证**: 需要
- **权限**: `orders.halt`

#### 路径参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数
```json
{
  "resumeReason": "客户确认恢复生产"
}
```

#### 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resumeReason | string | 是 | 恢复原因 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD20260115ABC123",
    "status": "IN_PRODUCTION",
    "haltedReason": null,
    "haltedAt": null,
    "resumedAt": "2026-01-16T10:00:00Z"
  }
}
```

### 20. 拆单预览
预览智能拆单结果。

#### 接口信息
- **URL**: `POST /api/v1/orders/{id}/split/preview`
- **认证**: 需要
- **权限**: `orders.split`

#### 路径参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数
```json
{
  "items": [
    {
      "itemId": "uuid",
      "supplierId": "uuid",
      "quantity": 1.00
    }
  ]
}
```

#### 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | array | 否 | 商品列表(可选,不传则自动匹配) |
| items[].itemId | string | 是 | 商品 ID |
| items[].supplierId | string | 否 | 供应商 ID(可选,不传则自动匹配) |
| items[].quantity | decimal | 是 | 数量 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "purchaseOrders": [
      {
        "supplierId": "uuid",
        "supplierName": "XX面料供应商",
        "items": [
          {
            "itemId": "uuid",
            "productName": "梦幻帘",
            "quantity": 2.00,
            "unitPrice": 300.00,
            "subtotal": 600.00
          }
        ],
        "subtotal": 600.00,
        "shippingFee": 120.00,
        "total": 720.00
      },
      {
        "supplierId": "uuid",
        "supplierName": "XX成品供应商",
        "items": [
          {
            "itemId": "uuid",
            "productName": "电机",
            "quantity": 1.00,
            "unitPrice": 800.00,
            "subtotal": 800.00
          }
        ],
        "subtotal": 800.00,
        "shippingFee": 160.00,
        "total": 960.00
      }
    ],
    "totalAmount": 1400.00,
    "totalShippingFee": 280.00,
    "grandTotal": 1680.00
  }
}
```

### 21. 确认拆单
确认拆单并生成采购单。

#### 接口信息
- **URL**: `POST /api/v1/orders/{id}/split/confirm`
- **认证**: 需要
- **权限**: `orders.split`

#### 路径参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数
```json
{
  "purchaseOrders": [
    {
      "supplierId": "uuid",
      "items": [
        {
          "itemId": "uuid",
          "quantity": 2.00
        }
      ]
    }
  ]
}
```

#### 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| purchaseOrders | array | 是 | 采购单列表 |
| purchaseOrders[].supplierId | string | 是 | 供应商 ID |
| purchaseOrders[].items | array | 是 | 商品列表 |
| purchaseOrders[].items[].itemId | string | 是 | 商品 ID |
| purchaseOrders[].items[].quantity | decimal | 是 | 数量 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNo": "OD20260101001",
    "purchaseOrderIds": [
      "uuid",
      "uuid"
    ],
    "status": "PENDING_PRODUCTION",
    "createdAt": "2026-01-16T10:00:00Z"
  }
}
```

### 22. 申请发货
申请订单发货。

#### 接口信息
- **URL**: `POST /api/v1/orders/{id}/delivery/request`
- **认证**: 需要
- **权限**: `orders.delivery`

#### 路径参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数
```json
{
  "deliveryAddress": "北京市朝阳区XXX小区",
  "scheduledDate": "2026-01-20"
}
```

#### 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deliveryAddress | string | 是 | 发货地址 |
| scheduledDate | string | 否 | 预约发货日期 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING_SHIPMENT",
    "deliveryAddress": "北京市朝阳区XXX小区",
    "scheduledDate": "2026-01-20",
    "updatedAt": "2026-01-16T10:00:00Z"
  }
}
```

### 23. 确认发货
确认订单发货。

#### 接口信息
- **URL**: `POST /api/v1/orders/{id}/delivery/confirm`
- **认证**: 需要
- **权限**: `orders.delivery`

#### 路径参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 请求参数
```json
{
  "logisticsCompany": "SF",
  "trackingNumber": "SF1234567890",
  "shippingFee": 280.00
}
```

#### 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| logisticsCompany | string | 是 | 物流公司代码(SF/DB/ZTO/YTO/STO/SELF_PICKUP) |
| trackingNumber | string | 是 | 运单号 |
| shippingFee | decimal | 否 | 运费 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "SHIPPED",
    "logisticsCompany": "SF",
    "trackingNumber": "SF1234567890",
    "shippingFee": 280.00,
    "shippedAt": "2026-01-16T10:00:00Z",
    "updatedAt": "2026-01-16T10:00:00Z"
  }
}
```

### 24. 获取变更历史
获取订单的变更历史。

#### 接口信息
- **URL**: `GET /api/v1/orders/{id}/change-requests`
- **认证**: 需要
- **权限**: `orders.read`

#### 路径参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderNo": "OD20260101001",
        "changeType": "MODIFY_ITEM",
        "changeReason": "客户要求修改尺寸",
        "originalItems": [...],
        "newItems": [...],
        "priceDifference": "20.00",
        "status": "APPROVED",
        "approvedBy": "uuid",
        "approvedByName": "店长",
        "approvedAt": "2026-01-16T11:00:00Z",
        "createdAt": "2026-01-16T10:00:00Z"
      }
    ]
  }
}
```
