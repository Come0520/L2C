# 供应链模块 API

> 供应链模块提供供应商管理、采购单管理、加工单管理、库存管理、发货管理等功能，支持供应链全流程管理。

## 概述

供应链模块是 L2C 系统的核心模块之一，负责管理所有供应链相关业务。系统支持供应商管理、采购单管理、加工单管理、库存管理、发货管理等功能。

### 核心功能

- 供应商管理（创建、查询、更新、删除）
- 采购单管理（创建、查询、更新、删除）
- 加工单管理（创建、查询、更新、删除）
- 库存管理
- 发货管理
- 供应商商品关联管理

---

## 1. 创建供应商

创建新供应商。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/suppliers`
- **认证**: 需要
- **权限**: `supply_chain.suppliers.create`

### 请求参数

```json
{
  "name": "深圳窗帘厂",
  "contactPerson": "李四",
  "phone": "13800138001",
  "paymentPeriod": "MONTHLY",
  "address": "深圳市南山区科技园",
  "remark": "长期合作供应商"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 供应商名称 |
| contactPerson | string | 否 | 联系人 |
| phone | string | 否 | 联系电话 |
| paymentPeriod | string | 否 | 结算周期：CASH/MONTHLY，默认 CASH |
| address | string | 否 | 地址 |
| remark | string | 否 | 备注 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "supplierNo": "SUP202601150001",
    "name": "深圳窗帘厂",
    "contactPerson": "李四",
    "phone": "13800138001",
    "paymentPeriod": "MONTHLY",
    "isActive": true,
    "address": "深圳市南山区科技园",
    "remark": "长期合作供应商",
    "createdBy": "uuid",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **供应商编号**：系统自动生成
2. **初始状态**：新供应商默认为活跃状态

---

## 2. 查询供应商列表

分页查询供应商列表，支持多条件筛选和搜索。

### 接口信息
- **URL**: `GET /api/v1/supply-chain/suppliers`
- **认证**: 需要
- **权限**: `supply_chain.suppliers.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| search | string | 否 | 搜索关键词（名称/联系人/电话） |
| isActive | boolean | 否 | 是否活跃 |
| paymentPeriod | string | 否 | 结算周期：CASH/MONTHLY |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "supplierNo": "SUP202601150001",
      "name": "深圳窗帘厂",
      "contactPerson": "李四",
      "phone": "13800138001",
      "paymentPeriod": "MONTHLY",
      "isActive": true,
      "totalPurchaseOrders": 50,
      "totalAmount": "500000.00",
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
```

---

## 3. 查询供应商详情

根据供应商 ID 查询供应商详细信息。

### 接口信息
- **URL**: `GET /api/v1/supply-chain/suppliers/{id}`
- **认证**: 需要
- **权限**: `supply_chain.suppliers.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 供应商 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "supplierNo": "SUP202601150001",
    "name": "深圳窗帘厂",
    "contactPerson": "李四",
    "phone": "13800138001",
    "paymentPeriod": "MONTHLY",
    "isActive": true,
    "address": "深圳市南山区科技园",
    "remark": "长期合作供应商",
    "createdBy": "uuid",
    "creator": {
      "id": "uuid",
      "name": "王五"
    },
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## 4. 更新供应商

更新供应商信息。

### 接口信息
- **URL**: `PUT /api/v1/supply-chain/suppliers/{id}`
- **认证**: 需要
- **权限**: `supply_chain.suppliers.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 供应商 ID |

### 请求参数

```json
{
  "name": "深圳窗帘厂（更名）",
  "contactPerson": "李四",
  "phone": "13800138001",
  "paymentPeriod": "MONTHLY",
  "isActive": true
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 供应商名称 |
| contactPerson | string | 否 | 联系人 |
| phone | string | 否 | 联系电话 |
| paymentPeriod | string | 否 | 结算周期：CASH/MONTHLY |
| isActive | boolean | 否 | 是否活跃 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "supplierNo": "SUP202601150001",
    "name": "深圳窗帘厂（更名）",
    "contactPerson": "李四",
    "phone": "13800138001",
    "paymentPeriod": "MONTHLY",
    "isActive": true,
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 5. 删除供应商

删除供应商。

### 接口信息
- **URL**: `DELETE /api/v1/supply-chain/suppliers/{id}`
- **认证**: 需要
- **权限**: `supply_chain.suppliers.delete`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 供应商 ID |

### 响应示例

```json
{
  "success": true,
  "message": "供应商删除成功"
}
```

### 业务规则

1. **关联采购单**：如果有未完成的采购单，不允许删除
2. **关联商品**：如果有关联的商品，不允许删除

---

## 6. 创建采购单

创建新采购单。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/purchase-orders`
- **认证**: 需要
- **权限**: `supply_chain.purchase_orders.create`

### 请求参数

```json
{
  "orderId": "uuid",
  "supplierId": "uuid",
  "type": "FINISHED",
  "splitRuleId": "uuid",
  "expectedDate": "2026-01-25",
  "items": [
    {
      "productId": "uuid",
      "productName": "窗帘",
      "sku": "CL001",
      "quantity": 10,
      "unitPrice": "500.00"
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 否 | 订单 ID |
| supplierId | string | 是 | 供应商 ID |
| type | string | 否 | 采购单类型：FINISHED/MATERIAL，默认 FINISHED |
| splitRuleId | string | 否 | 拆单规则 ID |
| expectedDate | string | 否 | 期望到货日期 |
| items | array | 是 | 采购项数组 |

### items 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 否 | 商品 ID |
| productName | string | 是 | 商品名称 |
| sku | string | 否 | 商品 SKU |
| quantity | number | 是 | 数量 |
| unitPrice | number | 是 | 单价 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "poNo": "PO2026011500001",
    "orderId": "uuid",
    "supplierId": "uuid",
    "supplierName": "深圳窗帘厂",
    "type": "FINISHED",
    "splitRuleId": "uuid",
    "status": "DRAFT",
    "totalAmount": "5000.00",
    "expectedDate": "2026-01-25",
    "createdBy": "uuid",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **采购单编号**：系统自动生成
2. **初始状态**：新采购单状态为 DRAFT
3. **自动计算**：系统自动计算采购单总金额

---

## 7. 查询采购单列表

分页查询采购单列表，支持多条件筛选和搜索。

### 接口信息
- **URL**: `GET /api/v1/supply-chain/purchase-orders`
- **认证**: 需要
- **权限**: `supply_chain.purchase_orders.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| status | string | 否 | 采购单状态 |
| supplierId | string | 否 | 供应商 ID |
| orderId | string | 否 | 订单 ID |
| type | string | 否 | 采购单类型：FINISHED/MATERIAL |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| search | string | 否 | 搜索关键词（采购单号） |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "poNo": "PO2026011500001",
      "orderId": "uuid",
      "orderNo": "ORD2026011500001",
      "supplierId": "uuid",
      "supplierName": "深圳窗帘厂",
      "type": "FINISHED",
      "status": "CONFIRMED",
      "totalAmount": "5000.00",
      "expectedDate": "2026-01-25",
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
```

---

## 8. 查询采购单详情

根据采购单 ID 查询采购单详细信息。

### 接口信息
- **URL**: `GET /api/v1/supply-chain/purchase-orders/{id}`
- **认证**: 需要
- **权限**: `supply_chain.purchase_orders.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 采购单 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "poNo": "PO2026011500001",
    "orderId": "uuid",
    "orderNo": "ORD2026011500001",
    "supplierId": "uuid",
    "supplierName": "深圳窗帘厂",
    "type": "FINISHED",
    "splitRuleId": "uuid",
    "status": "CONFIRMED",
    "totalAmount": "5000.00",
    "expectedDate": "2026-01-25",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "窗帘",
        "sku": "CL001",
        "quantity": "10",
        "unitPrice": "500.00",
        "subtotal": "5000.00"
      }
    ],
    "createdBy": "uuid",
    "creator": {
      "id": "uuid",
      "name": "王五"
    },
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## 9. 确认采购单

确认采购单。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/purchase-orders/{id}/confirm`
- **认证**: 需要
- **权限**: `supply_chain.purchase_orders.confirm`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 采购单 ID |

### 请求参数

```json
{
  "comment": "确认采购"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "poNo": "PO2026011500001",
    "status": "CONFIRMED",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 DRAFT 状态的采购单可以确认
2. **同步订单**：确认后同步更新订单项状态

---

## 10. 发货

采购单发货。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/purchase-orders/{id}/ship`
- **认证**: 需要
- **权限**: `supply_chain.purchase_orders.ship`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 采购单 ID |

### 请求参数

```json
{
  "trackingNumber": "SF1234567890",
  "shippingCompany": "顺丰快递",
  "shippedAt": "2026-01-20T10:00:00Z",
  "comment": "已发货"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| trackingNumber | string | 是 | 物流单号 |
| shippingCompany | string | 是 | 物流公司 |
| shippedAt | string | 否 | 发货时间 |
| comment | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "poNo": "PO2026011500001",
    "status": "SHIPPED",
    "trackingNumber": "SF1234567890",
    "shippingCompany": "顺丰快递",
    "shippedAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 CONFIRMED 状态的采购单可以发货
2. **同步订单**：发货后同步更新订单项状态

---

## 11. 收货

采购单收货。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/purchase-orders/{id}/receive`
- **认证**: 需要
- **权限**: `supply_chain.purchase_orders.receive`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 采购单 ID |

### 请求参数

```json
{
  "items": [
    {
      "itemId": "uuid",
      "receivedQuantity": 10,
      "qualityStatus": "GOOD",
      "comment": "质量良好"
    }
  ],
  "comment": "已收货"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | array | 是 | 收货项数组 |
| comment | string | 否 | 备注 |

### items 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | string | 是 | 采购项 ID |
| receivedQuantity | number | 是 | 实收数量 |
| qualityStatus | string | 是 | 质量状态：GOOD/DAMAGED/DEFECTIVE |
| comment | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "poNo": "PO2026011500001",
    "status": "RECEIVED",
    "receivedAt": "2026-01-25T10:00:00Z",
    "updatedAt": "2026-01-25T10:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 SHIPPED 状态的采购单可以收货
2. **库存更新**：收货后自动更新库存
3. **同步订单**：收货后同步更新订单项状态

---

## 12. 创建加工单

创建新加工单。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/work-orders`
- **认证**: 需要
- **权限**: `supply_chain.work_orders.create`

### 请求参数

```json
{
  "orderId": "uuid",
  "poId": "uuid",
  "supplierId": "uuid",
  "type": "CUTTING",
  "expectedDate": "2026-01-25",
  "items": [
    {
      "productId": "uuid",
      "productName": "窗帘",
      "sku": "CL001",
      "quantity": 10,
      "specifications": {
        "width": 200,
        "height": 150,
        "color": "白色"
      }
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 否 | 订单 ID |
| poId | string | 否 | 采购单 ID |
| supplierId | string | 是 | 供应商 ID |
| type | string | 否 | 加工类型：CUTTING/SEWING/ASSEMBLY |
| expectedDate | string | 否 | 期望完成日期 |
| items | array | 是 | 加工项数组 |

### items 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 否 | 商品 ID |
| productName | string | 是 | 商品名称 |
| sku | string | 否 | 商品 SKU |
| quantity | number | 是 | 数量 |
| specifications | object | 否 | 加工规格 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "woNo": "WO2026011500001",
    "orderId": "uuid",
    "poId": "uuid",
    "supplierId": "uuid",
    "supplierName": "深圳窗帘厂",
    "type": "CUTTING",
    "status": "PENDING",
    "expectedDate": "2026-01-25",
    "createdBy": "uuid",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **加工单编号**：系统自动生成
2. **初始状态**：新加工单状态为 PENDING

---

## 13. 开始加工

开始加工。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/work-orders/{id}/start`
- **认证**: 需要
- **权限**: `supply_chain.work_orders.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 加工单 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "woNo": "WO2026011500001",
    "status": "IN_PROGRESS",
    "startedAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 PENDING 状态的加工单可以开始

---

## 14. 完成加工

完成加工。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/work-orders/{id}/complete`
- **认证**: 需要
- **权限**: `supply_chain.work_orders.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 加工单 ID |

### 请求参数

```json
{
  "comment": "加工完成"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "woNo": "WO2026011500001",
    "status": "COMPLETED",
    "completedAt": "2026-01-25T10:00:00Z",
    "updatedAt": "2026-01-25T10:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 IN_PROGRESS 状态的加工单可以完成
2. **库存更新**：完成后自动更新库存

---

## 15. 查询库存

查询商品库存。

### 接口信息
- **URL**: `GET /api/v1/supply-chain/inventory`
- **认证**: 需要
- **权限**: `supply_chain.inventory.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 否 | 商品 ID |
| sku | string | 否 | 商品 SKU |
| warehouseId | string | 否 | 仓库 ID |
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "窗帘",
      "sku": "CL001",
      "warehouseId": "uuid",
      "warehouseName": "深圳仓库",
      "quantity": 100,
      "reservedQuantity": 20,
      "availableQuantity": 80,
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 16. 库存调整

调整商品库存。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/inventory/adjust`
- **认证**: 需要
- **权限**: `supply_chain.inventory.adjust`

### 请求参数

```json
{
  "items": [
    {
      "productId": "uuid",
      "warehouseId": "uuid",
      "adjustmentType": "IN",
      "quantity": 10,
      "reason": "采购入库"
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | array | 是 | 调整项数组 |

### items 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 是 | 商品 ID |
| warehouseId | string | 是 | 仓库 ID |
| adjustmentType | string | 是 | 调整类型：IN/OUT/ADJUST |
| quantity | number | 是 | 数量 |
| reason | string | 是 | 调整原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "adjustedCount": 1,
    "items": [
      {
        "productId": "uuid",
        "oldQuantity": 100,
        "newQuantity": 110,
        "adjustment": 10
      }
    ]
  }
}
```

### 业务规则

1. **库存验证**：出库时验证库存是否充足
2. **库存记录**：所有库存调整都会记录日志

---

## 17. 查询发货记录

查询发货记录。

### 接口信息
- **URL**: `GET /api/v1/supply-chain/shipments`
- **认证**: 需要
- **权限**: `supply_chain.shipments.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| poId | string | 否 | 采购单 ID |
| orderId | string | 否 | 订单 ID |
| status | string | 否 | 发货状态 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "poId": "uuid",
      "poNo": "PO2026011500001",
      "orderId": "uuid",
      "orderNo": "ORD2026011500001",
      "trackingNumber": "SF1234567890",
      "shippingCompany": "顺丰快递",
      "status": "DELIVERED",
      "shippedAt": "2026-01-20T10:00:00Z",
      "deliveredAt": "2026-01-25T10:00:00Z",
      "createdAt": "2026-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 18. 添加供应商商品

为供应商添加商品。

### 接口信息
- **URL**: `POST /api/v1/supply-chain/suppliers/{id}/products`
- **认证**: 需要
- **权限**: `supply_chain.suppliers.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 供应商 ID |

### 请求参数

```json
{
  "productId": "uuid",
  "isDefault": true,
  "purchasePrice": "500.00",
  "leadTime": 7
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 是 | 商品 ID |
| isDefault | boolean | 否 | 是否默认供应商 |
| purchasePrice | string | 否 | 采购价 |
| leadTime | integer | 否 | 交货周期（天） |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "supplierId": "uuid",
    "productId": "uuid",
    "isDefault": true,
    "purchasePrice": "500.00",
    "leadTime": 7,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **唯一性**：同一供应商不能重复添加同一商品
2. **默认供应商**：一个商品只能有一个默认供应商

---

## 19. 供应链统计

获取供应链统计数据。

### 接口信息
- **URL**: `GET /api/v1/supply-chain/statistics`
- **认证**: 需要
- **权限**: `supply_chain.read`

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
    "suppliers": {
      "total": 50,
      "active": 45,
      "inactive": 5
    },
    "purchaseOrders": {
      "total": 500,
      "draft": 10,
      "confirmed": 50,
      "shipped": 100,
      "received": 300,
      "cancelled": 40
    },
    "workOrders": {
      "total": 300,
      "pending": 20,
      "inProgress": 50,
      "completed": 200,
      "cancelled": 30
    },
    "inventory": {
      "totalProducts": 1000,
      "totalQuantity": 10000,
      "lowStockProducts": 50
    },
    "shipments": {
      "total": 400,
      "inTransit": 50,
      "delivered": 350
    }
  }
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| SUPPLIER_NOT_FOUND | 404 | 供应商不存在 |
| SUPPLIER_ALREADY_EXISTS | 409 | 供应商已存在 |
| SUPPLIER_CANNOT_DELETE | 422 | 供应商不能删除 |
| SUPPLIER_INVALID_TYPE | 400 | 供应商类型无效 |
| SUPPLIER_INVALID_PAYMENT_PERIOD | 400 | 结算周期无效 |
| PURCHASE_ORDER_NOT_FOUND | 404 | 采购单不存在 |
| PURCHASE_ORDER_ALREADY_EXISTS | 409 | 采购单已存在 |
| PURCHASE_ORDER_CANNOT_CREATE | 422 | 采购单不能创建 |
| PURCHASE_ORDER_CANNOT_DELETE | 422 | 采购单不能删除 |
| PURCHASE_ORDER_CANNOT_CONFIRM | 422 | 采购单不能确认 |
| PURCHASE_ORDER_CANNOT_SHIP | 422 | 采购单不能发货 |
| PURCHASE_ORDER_INVALID_STATUS | 400 | 采购单状态无效 |
| PURCHASE_ORDER_INVALID_TYPE | 400 | 采购单类型无效 |
| PURCHASE_ORDER_ITEM_NOT_FOUND | 404 | 采购单项不存在 |
| PURCHASE_ORDER_ITEM_INVALID | 400 | 采购单项无效 |
| WORK_ORDER_NOT_FOUND | 404 | 加工单不存在 |
| WORK_ORDER_ALREADY_EXISTS | 409 | 加工单已存在 |
| WORK_ORDER_CANNOT_CREATE | 422 | 加工单不能创建 |
| WORK_ORDER_CANNOT_DELETE | 422 | 加工单不能删除 |
| WORK_ORDER_CANNOT_START | 422 | 加工单不能开始 |
| WORK_ORDER_CANNOT_COMPLETE | 422 | 加工单不能完成 |
| WORK_ORDER_INVALID_STATUS | 400 | 加工单状态无效 |
| WORK_ORDER_ITEM_NOT_FOUND | 404 | 加工单项不存在 |
| WORK_ORDER_ITEM_INVALID | 400 | 加工单项无效 |
| INVENTORY_NOT_FOUND | 404 | 库存不存在 |
| INVENTORY_INSUFFICIENT | 422 | 库存不足 |
| INVENTORY_ADJUSTMENT_INVALID | 400 | 库存调整无效 |

---

## 数据模型

### Supplier

```typescript
interface Supplier {
  id: string;
  tenantId: string;
  supplierNo: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  paymentPeriod: 'CASH' | 'MONTHLY';
  isActive: boolean;
  address?: string;
  remark?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PurchaseOrder

```typescript
interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNo: string;
  orderId?: string;
  supplierId: string;
  supplierName: string;
  type: 'FINISHED' | 'MATERIAL';
  splitRuleId?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: string;
  expectedDate?: Date;
  trackingNumber?: string;
  shippingCompany?: string;
  shippedAt?: Date;
  receivedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PurchaseOrderItem

```typescript
interface PurchaseOrderItem {
  id: string;
  tenantId: string;
  poId: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  receivedQuantity?: string;
  qualityStatus?: 'GOOD' | 'DAMAGED' | 'DEFECTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

### WorkOrder

```typescript
interface WorkOrder {
  id: string;
  tenantId: string;
  woNo: string;
  orderId?: string;
  poId?: string;
  supplierId: string;
  supplierName: string;
  type: 'CUTTING' | 'SEWING' | 'ASSEMBLY';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  expectedDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### WorkOrderItem

```typescript
interface WorkOrderItem {
  id: string;
  tenantId: string;
  workOrderId: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: string;
  specifications?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Inventory

```typescript
interface Inventory {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  sku?: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: Date;
}
```

### Shipment

```typescript
interface Shipment {
  id: string;
  tenantId: string;
  poId: string;
  poNo: string;
  orderId?: string;
  orderNo?: string;
  trackingNumber: string;
  shippingCompany: string;
  status: 'PENDING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
