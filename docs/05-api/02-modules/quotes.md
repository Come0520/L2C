# 报价单模块 API

> 报价单模块提供报价单的创建、查询、更新、删除等功能，支持报价单版本管理、房间管理、项目管理、报价计算等功能。

## 概述

报价单模块是 L2C 系统的核心模块之一，负责管理所有报价单信息。系统支持报价单版本管理、房间管理、项目管理、报价计算、折扣管理等功能。

### 核心功能

- 报价单信息管理（创建、查询、更新、删除）
- 报价单版本管理
- 房间管理
- 项目管理
- 报价计算
- 折扣管理
- 报价单锁定
- 报价单转换订单
- 测量数据导入

---

## 1. 创建报价单

创建新报价单。

### 接口信息
- **URL**: `POST /api/v1/quotes`
- **认证**: 需要
- **权限**: `quotes.create`

### 请求参数

```json
{
  "customerId": "uuid",
  "leadId": "uuid",
  "measureVariantId": "uuid",
  "title": "阳光小区张三报价单",
  "notes": "客户意向高",
  "validUntil": "2026-02-15"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| customerId | string | 是 | 客户 ID |
| leadId | string | 否 | 线索 ID |
| measureVariantId | string | 否 | 测量变体 ID |
| title | string | 否 | 报价单标题 |
| notes | string | 否 | 备注 |
| validUntil | string | 否 | 有效期 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001",
    "customerId": "uuid",
    "leadId": "uuid",
    "measureVariantId": "uuid",
    "title": "阳光小区张三报价单",
    "totalAmount": "0.00",
    "discountRate": "1.0000",
    "discountAmount": "0.00",
    "finalAmount": "0.00",
    "status": "DRAFT",
    "version": 1,
    "isActive": true,
    "validUntil": "2026-02-15",
    "notes": "客户意向高",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **报价单编号**：系统自动生成，格式为 `QT + 时间戳`
2. **初始状态**：新报价单状态为 DRAFT
3. **初始版本**：新报价单版本为 1

---

## 2. 查询报价单列表

分页查询报价单列表，支持多条件筛选和搜索。

### 接口信息
- **URL**: `GET /api/v1/quotes`
- **认证**: 需要
- **权限**: `quotes.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| status | string | 否 | 报价单状态 |
| search | string | 否 | 搜索关键词 |
| customerId | string | 否 | 客户 ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "quoteNo": "QT2026011500001",
      "title": "阳光小区张三报价单",
      "totalAmount": "50000.00",
      "finalAmount": "45000.00",
      "status": "SUBMITTED",
      "version": 1,
      "customer": {
        "id": "uuid",
        "name": "张三",
        "phone": "13800138000"
      },
      "creator": {
        "id": "uuid",
        "name": "李四"
      },
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

## 3. 查询报价单详情

根据报价单 ID 查询报价单详细信息，包括房间、项目等。

### 接口信息
- **URL**: `GET /api/v1/quotes/{id}`
- **认证**: 需要
- **权限**: `quotes.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001",
    "customerId": "uuid",
    "leadId": "uuid",
    "measureVariantId": "uuid",
    "title": "阳光小区张三报价单",
    "totalAmount": "50000.00",
    "discountRate": "0.9000",
    "discountAmount": "5000.00",
    "finalAmount": "45000.00",
    "status": "SUBMITTED",
    "version": 1,
    "isActive": true,
    "validUntil": "2026-02-15",
    "notes": "客户意向高",
    "lockedAt": null,
    "customer": {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000"
    },
    "creator": {
      "id": "uuid",
      "name": "李四"
    },
    "rooms": [
      {
        "id": "uuid",
        "name": "客厅",
        "sortOrder": 1,
        "measureRoomId": "uuid",
        "items": [
          {
            "id": "uuid",
            "productId": "uuid",
            "productName": "窗帘",
            "sku": "CL001",
            "quantity": 2,
            "unitPrice": "1000.00",
            "subtotal": "2000.00",
            "sortOrder": 1
          }
        ]
      }
    ],
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "安装费",
        "sku": "FW001",
        "quantity": 1,
        "unitPrice": "500.00",
        "subtotal": "500.00",
        "sortOrder": 1
      }
    ],
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## 4. 更新报价单

更新报价单基本信息。

### 接口信息
- **URL**: `PUT /api/v1/quotes/{id}`
- **认证**: 需要
- **权限**: `quotes.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "title": "阳光小区张三报价单（修改）",
  "notes": "客户意向高，需要跟进",
  "validUntil": "2026-02-20",
  "discountRate": 0.9,
  "discountAmount": 5000
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 报价单标题 |
| notes | string | 否 | 备注 |
| validUntil | string | 否 | 有效期 |
| discountRate | number | 否 | 折扣率（0-1） |
| discountAmount | number | 否 | 折扣金额 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001",
    "title": "阳光小区张三报价单（修改）",
    "totalAmount": "50000.00",
    "discountRate": "0.9000",
    "discountAmount": "5000.00",
    "finalAmount": "45000.00",
    "status": "DRAFT",
    "notes": "客户意向高，需要跟进",
    "validUntil": "2026-02-20",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：已提交或已锁定的报价单不能修改
2. **折扣限制**：折扣率和折扣金额不能同时设置
3. **自动计算**：修改折扣后自动计算最终金额

---

## 5. 删除报价单

删除报价单。

### 接口信息
- **URL**: `DELETE /api/v1/quotes/{id}`
- **认证**: 需要
- **权限**: `quotes.delete`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 响应示例

```json
{
  "success": true,
  "message": "报价单删除成功"
}
```

### 业务规则

1. **状态限制**：已提交或已锁定的报价单不能删除
2. **关联订单**：如果报价单已转换为订单，不允许删除

---

## 6. 创建报价单房间

为报价单添加房间。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/rooms`
- **认证**: 需要
- **权限**: `quotes.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "name": "客厅",
  "measureRoomId": "uuid",
  "sortOrder": 1
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 房间名称 |
| measureRoomId | string | 否 | 测量房间 ID |
| sortOrder | integer | 否 | 排序序号 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteId": "uuid",
    "name": "客厅",
    "measureRoomId": "uuid",
    "sortOrder": 1,
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 7. 更新报价单房间

更新报价单房间信息。

### 接口信息
- **URL**: `PUT /api/v1/quotes/rooms/{roomId}`
- **认证**: 需要
- **权限**: `quotes.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomId | uuid | 是 | 房间 ID |

### 请求参数

```json
{
  "name": "主卧",
  "sortOrder": 2
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "主卧",
    "sortOrder": 2,
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 8. 删除报价单房间

删除报价单房间。

### 接口信息
- **URL**: `DELETE /api/v1/quotes/rooms/{roomId}`
- **认证**: 需要
- **权限**: `quotes.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomId | uuid | 是 | 房间 ID |

### 响应示例

```json
{
  "success": true,
  "message": "房间删除成功"
}
```

### 业务规则

1. **关联项目**：如果房间下有项目，不允许删除
2. **自动删除**：删除房间时，房间下的所有项目也会被删除

---

## 9. 创建报价项目

为报价单或房间添加项目。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/items`
- **认证**: 需要
- **权限**: `quotes.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "productId": "uuid",
  "productName": "窗帘",
  "sku": "CL001",
  "quantity": 2,
  "unitPrice": 1000,
  "processFee": 100,
  "roomId": "uuid",
  "sortOrder": 1,
  "attributes": {
    "width": 200,
    "height": 150,
    "color": "白色"
  }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 否 | 商品 ID |
| productName | string | 是 | 商品名称 |
| sku | string | 否 | 商品 SKU |
| quantity | number | 是 | 数量 |
| unitPrice | number | 是 | 单价 |
| processFee | number | 否 | 加工费 |
| roomId | string | 否 | 房间 ID |
| sortOrder | integer | 否 | 排序序号 |
| attributes | object | 否 | 商品属性 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteId": "uuid",
    "roomId": "uuid",
    "productId": "uuid",
    "productName": "窗帘",
    "sku": "CL001",
    "quantity": 2,
    "unitPrice": "1000.00",
    "processFee": "100.00",
    "subtotal": "2100.00",
    "sortOrder": 1,
    "attributes": {
      "width": 200,
      "height": 150,
      "color": "白色"
    },
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **自动计算**：系统自动计算小计（单价 × 数量 + 加工费）
2. **自动更新**：添加项目后自动更新报价单总金额
3. **商品验证**：如果提供了商品 ID，会验证商品是否存在

---

## 10. 更新报价项目

更新报价项目信息。

### 接口信息
- **URL**: `PUT /api/v1/quotes/items/{itemId}`
- **认证**: 需要
- **权限**: `quotes.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | uuid | 是 | 项目 ID |

### 请求参数

```json
{
  "quantity": 3,
  "unitPrice": 1200,
  "processFee": 150,
  "attributes": {
    "width": 220,
    "height": 160,
    "color": "米色"
  }
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quantity": 3,
    "unitPrice": "1200.00",
    "processFee": "150.00",
    "subtotal": "3750.00",
    "attributes": {
      "width": 220,
      "height": 160,
      "color": "米色"
    },
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **自动计算**：修改数量或价格后自动重新计算小计
2. **自动更新**：修改项目后自动更新报价单总金额

---

## 11. 删除报价项目

删除报价项目。

### 接口信息
- **URL**: `DELETE /api/v1/quotes/items/{itemId}`
- **认证**: 需要
- **权限**: `quotes.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | uuid | 是 | 项目 ID |

### 响应示例

```json
{
  "success": true,
  "message": "项目删除成功"
}
```

### 业务规则

1. **自动更新**：删除项目后自动更新报价单总金额

---

## 12. 创建新版本

创建报价单的新版本。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/versions`
- **认证**: 需要
- **权限**: `quotes.create`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "reason": "客户要求修改价格"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 否 | 创建原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001-V2",
    "customerId": "uuid",
    "leadId": "uuid",
    "title": "阳光小区张三报价单",
    "totalAmount": "50000.00",
    "status": "DRAFT",
    "version": 2,
    "parentQuoteId": "uuid",
    "isActive": true,
    "lockedAt": null,
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **版本递增**：新版本号 = 旧版本号 + 1
2. **编号规则**：新版本编号 = 原编号 + `-V{版本号}`
3. **数据复制**：新版本会复制原版本的所有数据（包括房间和项目）
4. **原版本失效**：原版本的 `isActive` 设置为 false
5. **状态重置**：新版本状态重置为 DRAFT
6. **解锁**：新版本自动解锁

---

## 13. 提交报价单

提交报价单。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/submit`
- **认证**: 需要
- **权限**: `quotes.submit`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "comment": "报价单已确认，请客户审核"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment | string | 否 | 提交备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001",
    "status": "SUBMITTED",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 DRAFT 状态的报价单可以提交
2. **数据验证**：提交前验证报价单数据完整性
3. **锁定**：提交后报价单自动锁定

---

## 14. 接受报价单

接受报价单。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/accept`
- **认证**: 需要
- **权限**: `quotes.accept`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "comment": "客户接受报价"
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001",
    "status": "ACCEPTED",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 SUBMITTED 状态的报价单可以接受
2. **有效期检查**：接受前检查报价单是否在有效期内

---

## 15. 拒绝报价单

拒绝报价单。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/reject`
- **认证**: 需要
- **权限**: `quotes.reject`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "reason": "价格太高"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 拒绝原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001",
    "status": "REJECTED",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 SUBMITTED 状态的报价单可以拒绝
2. **必填原因**：拒绝时必须提供原因

---

## 16. 锁定报价单

锁定报价单。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/lock`
- **认证**: 需要
- **权限**: `quotes.lock`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "reason": "客户确认价格，准备下单"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 否 | 锁定原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001",
    "lockedAt": "2026-01-15T11:00:00Z",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 DRAFT 或 SUBMITTED 状态的报价单可以锁定
2. **锁定时间**：锁定后记录锁定时间
3. **禁止修改**：锁定后的报价单不能修改

---

## 17. 解锁报价单

解锁报价单。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/unlock`
- **认证**: 需要
- **权限**: `quotes.unlock`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "reason": "客户需要修改"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 否 | 解锁原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quoteNo": "QT2026011500001",
    "lockedAt": null,
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **权限限制**：只有管理员或创建者可以解锁
2. **解锁时间**：解锁后清除锁定时间

---

## 18. 导入测量数据

导入测量数据到报价单。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/import-measurement`
- **认证**: 需要
- **权限**: `quotes.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "measureTaskId": "uuid",
  "mappingStrategy": "AUTO"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| measureTaskId | string | 是 | 测量任务 ID |
| mappingStrategy | string | 否 | 映射策略：AUTO/MANUAL |

### 响应示例

```json
{
  "success": true,
  "data": {
    "importedRooms": 3,
    "importedItems": 15,
    "warnings": [
      "部分测量项无法自动映射，请手动处理"
    ]
  }
}
```

### 业务规则

1. **智能映射**：系统会自动将测量数据映射到报价单项目
2. **房间映射**：根据房间名称或 ID 映射房间
3. **项目映射**：根据测量项类型和尺寸映射项目
4. **警告提示**：无法自动映射的项目会生成警告

---

## 19. 转换为订单

将报价单转换为订单。

### 接口信息
- **URL**: `POST /api/v1/quotes/{id}/convert-to-order`
- **认证**: 需要
- **权限**: `quotes.convert`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 请求参数

```json
{
  "orderType": "RETAIL",
  "settlementType": "FULL_PAYMENT",
  "depositAmount": 5000,
  "deliveryAddressId": "uuid",
  "notes": "客户要求尽快安装"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderType | string | 否 | 订单类型：RETAIL/WHOLESALE |
| settlementType | string | 否 | 结算类型：FULL_PAYMENT/INSTALLMENT |
| depositAmount | number | 否 | 定金金额 |
| deliveryAddressId | string | 否 | 配送地址 ID |
| notes | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNo": "ORD2026011500001",
    "quoteId": "uuid",
    "quoteNo": "QT2026011500001",
    "customerId": "uuid",
    "totalAmount": "45000.00",
    "depositAmount": "5000.00",
    "remainingAmount": "40000.00",
    "status": "PENDING",
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 ACCEPTED 状态的报价单可以转换
2. **数据复制**：订单会复制报价单的所有数据
3. **报价单锁定**：转换后报价单自动锁定
4. **订单创建**：自动创建订单和订单项

---

## 20. 报价单版本历史

查询报价单的版本历史。

### 接口信息
- **URL**: `GET /api/v1/quotes/{id}/versions`
- **认证**: 需要
- **权限**: `quotes.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "quoteNo": "QT2026011500001-V2",
      "version": 2,
      "status": "ACCEPTED",
      "totalAmount": "45000.00",
      "isActive": true,
      "createdAt": "2026-01-15T11:00:00Z"
    },
    {
      "id": "uuid",
      "quoteNo": "QT2026011500001-V1",
      "version": 1,
      "status": "REJECTED",
      "totalAmount": "50000.00",
      "isActive": false,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| QUOTE_NOT_FOUND | 404 | 报价单不存在 |
| QUOTE_ALREADY_EXISTS | 409 | 报价单已存在 |
| QUOTE_CANNOT_DELETE | 422 | 报价单不能删除 |
| QUOTE_CANNOT_SUBMIT | 422 | 报价单不能提交 |
| QUOTE_CANNOT_ACCEPT | 422 | 报价单不能接受 |
| QUOTE_CANNOT_REJECT | 422 | 报价单不能拒绝 |
| QUOTE_CANNOT_CREATE_VERSION | 422 | 报价单不能创建版本 |
| QUOTE_INVALID_STATUS | 400 | 报价单状态无效 |
| QUOTE_INVALID_VERSION | 400 | 报价单版本无效 |
| QUOTE_EXPIRED | 422 | 报价单已过期 |
| QUOTE_LOCKED | 422 | 报价单已锁定 |
| QUOTE_ROOM_NOT_FOUND | 404 | 报价单房间不存在 |
| QUOTE_ITEM_NOT_FOUND | 404 | 报价单项不存在 |
| QUOTE_ITEM_INVALID | 400 | 报价单项无效 |
| QUOTE_AMOUNT_INVALID | 400 | 报价金额无效 |
| QUOTE_DISCOUNT_INVALID | 400 | 折扣无效 |

---

## 数据模型

### Quote

```typescript
interface Quote {
  id: string;
  tenantId: string;
  quoteNo: string;
  customerId: string;
  leadId?: string;
  measureVariantId?: string;
  parentQuoteId?: string;
  title?: string;
  totalAmount: string;
  discountRate: string;
  discountAmount: string;
  finalAmount: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  version: number;
  isActive: boolean;
  validUntil?: Date;
  notes?: string;
  lockedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### QuoteRoom

```typescript
interface QuoteRoom {
  id: string;
  tenantId: string;
  quoteId: string;
  name: string;
  measureRoomId?: string;
  sortOrder: number;
  createdAt: Date;
}
```

### QuoteItem

```typescript
interface QuoteItem {
  id: string;
  tenantId: string;
  quoteId: string;
  roomId?: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: string;
  processFee: string;
  subtotal: string;
  sortOrder: number;
  attributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```
