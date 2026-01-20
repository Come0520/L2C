# 订单模块API实现文档

**版本**: v1.0  
**创建时间**: 2026-01-16  
**基于文档**: [订单模块整改计划_20260116.md](./订单模块整改计划_20260116.md)  
**目标读者**: 后端开发、前端开发、API测试人员

---

## 📋 目录

1. [API总览](#1-api总览)
2. [基础CRUD API](#2-基础crud-api)
3. [订单锁定机制](#3-订单锁定机制)
4. [拆单API](#4-拆单api)
5. [发货API](#5-发货api)
6. [物流API](#6-物流api)
7. [变更单API](#7-变更单api)
8. [撤单API](#8-撤单api)
9. [叫停API](#9-叫停api)
10. [错误处理](#10-错误处理)
11. [权限控制](#11-权限控制)

---

## 1. API总览

### 1.1 API列表

| API端点 | HTTP方法 | 优先级 | 实现状态 | 说明 |
|:---|:---:|:---:|:---:|:---|
| **基础CRUD** |
| `/api/orders` | POST | P0 | ✅ 已实现 | 从报价单创建订单 |
| `/api/orders` | GET | P0 | ✅ 已实现 | 获取订单列表 |
| `/api/orders/{id}` | GET | P0 | ✅ 已实现 | 获取订单详情 |
| `/api/orders/{id}` | PUT | P1 | ❌ 缺失 | 更新订单 |
| **锁定机制** |
| `/api/orders/{id}/lock` | POST | P0 | ⚠️ Service实现,无Action | 锁定订单 |
| `/api/orders/{id}/unlock` | POST | P1 | ❌ 缺失 | 解锁订单 |
| **拆单** |
| `/api/orders/{id}/split/preview` | POST | P0 | ❌ Mock仅5行 | 拆单预览 |
| `/api/orders/{id}/split/confirm` | POST | P0 | ❌ Mock仅5行 | 确认拆单 |
| **发货** |
| `/api/orders/{id}/delivery/request` | POST | P0 | ❌ 缺失 | 申请发货 |
| `/api/orders/{id}/delivery/confirm` | POST | P0 | ❌ 缺失 | 确认发货 |
| **物流** |
| `/api/orders/{id}/logistics` | PUT | P1 | ❌ 缺失 | 更新物流信息 |
| `/api/orders/{id}/logistics-track` | GET | P1 | ❌ 缺失 | 查询物流轨迹 |
| **变更单** |
| `/api/orders/{id}/change-requests` | POST | P0 | ❌ 缺失 | 创建变更请求 |
| `/api/orders/{id}/change-requests` | GET | P0 | ❌ 缺失 | 获取变更历史 |
| `/api/change-requests/{id}/approve` | POST | P0 | ❌ 缺失 | 审批变更 |
| `/api/change-requests/{id}/reject` | POST | P0 | ❌ 缺失 | 拒绝变更 |
| **撤单** |
| `/api/orders/{id}/cancel` | POST | P1 | ❌ 缺失 | 申请撤单 |
| **叫停** |
| `/api/orders/{id}/halt` | POST | P1 | ❌ 缺失 | 叫停订单 |
| `/api/orders/{id}/resume` | POST | P1 | ❌ 缺失 | 恢复订单 |

### 1.2 API统计

- **API总数**: 18个核心API
- **已完整实现**: 3个 (16.7%)
- **部分实现**: 1个 (lock有Service但无Action)
- **Mock实现**: 2个 (拆单相关)
- **完全缺失**: 12个 (66.7%)
- **🎯 API完成度**: ~20%

---

## 2. 基础CRUD API

### 2.1 创建订单

**端点**: `POST /api/orders`

**认证**: 需要

**权限**: `orders.create`

**请求参数**:
```json
{
  "quoteId": "uuid",
  "paymentAmount": 3000.00,
  "paymentMethod": "WECHAT",
  "paymentTime": "2026-01-16T10:00:00Z",
  "paymentProofImg": "https://oss.example.com/payment-proof.jpg",
  "confirmationImg": "https://oss.example.com/confirmation.jpg"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| quoteId | UUID | ✓ | 报价单ID |
| paymentAmount | Decimal | - | 收款金额(现结客户必填) |
| paymentMethod | Enum | - | 支付方式(CASH/WECHAT/ALIPAY/BANK) |
| paymentTime | DateTime | - | 收款时间 |
| paymentProofImg | String | - | 收款凭证URL(现结客户必填) |
| confirmationImg | String | - | 客户确认凭证URL(月结客户必填) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "OD20260116001",
    "quoteId": "uuid",
    "status": "PENDING_PO",
    "totalAmount": 10000.00,
    "paidAmount": 3000.00,
    "settlementType": "PREPAID",
    "createdAt": "2026-01-16T10:00:00Z"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "QUOTE_NOT_WON",
    "message": "仅WON状态的报价单可转订单"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|:---|:---|
| QUOTE_NOT_FOUND | 报价单不存在 |
| QUOTE_NOT_WON | 报价单状态不是WON |
| ORDER_ALREADY_EXISTS | 该报价单已创建订单 |
| PAYMENT_AMOUNT_INVALID | 收款金额无效 |
| PAYMENT_PROOF_REQUIRED | 需上传收款凭证 |

---

### 2.2 获取订单列表

**端点**: `GET /api/orders`

**认证**: 需要

**权限**: `orders.read`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| page | Integer | - | 页码(默认1) |
| pageSize | Integer | - | 每页数量(默认10) |
| status | String | - | 订单状态(可多选) |
| customerId | UUID | - | 客户ID |
| salesId | UUID | - | 销售ID |
| startDate | Date | - | 开始日期 |
| endDate | Date | - | 结束日期 |
| keyword | String | - | 搜索关键词(客户名/订单号) |

**请求示例**:
```
GET /api/orders?page=1&pageSize=10&status=PENDING_PO,PENDING_PRODUCTION&keyword=张三
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderNo": "OD20260116001",
        "customerName": "张三",
        "customerPhone": "138****8000",
        "totalAmount": 10000.00,
        "paidAmount": 3000.00,
        "status": "PENDING_PO",
        "settlementType": "PREPAID",
        "salesName": "李四",
        "createdAt": "2026-01-16T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

### 2.3 获取订单详情

**端点**: `GET /api/orders/{id}`

**认证**: 需要

**权限**: `orders.read`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "OD20260116001",
    "quoteId": "uuid",
    "quoteVersionId": "uuid",
    "leadId": "uuid",
    "customerId": "uuid",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "deliveryAddress": "北京市朝阳区XXX小区",
    "status": "PENDING_PO",
    "totalAmount": 10000.00,
    "paidAmount": 3000.00,
    "settlementType": "PREPAID",
    "confirmationImg": "https://oss.example.com/confirmation.jpg",
    "paymentProofImg": "https://oss.example.com/payment-proof.jpg",
    "paymentAmount": 3000.00,
    "paymentMethod": "WECHAT",
    "paymentTime": "2026-01-16T10:00:00Z",
    "salesId": "uuid",
    "salesName": "李四",
    "remark": "备注信息",
    "snapshotData": {
      "quote": {
        "id": "uuid",
        "quoteNo": "QT20260115001",
        "totalAmount": 10000.00,
        "items": [...]
      },
      "customer": {
        "id": "uuid",
        "name": "张三",
        "phone": "13800138000",
        "address": "北京市朝阳区XXX小区"
      },
      "snapshotTime": "2026-01-16T10:00:00Z"
    },
    "items": [
      {
        "id": "uuid",
        "roomName": "客厅",
        "productName": "梦幻帘",
        "category": "CURTAIN",
        "unitPrice": 300.00,
        "quantity": 2.00,
        "width": 2.50,
        "height": 2.80,
        "subtotal": 600.00,
        "supplierId": null,
        "purchaseOrderId": null,
        "deliveryStatus": "PENDING",
        "deliveredAt": null
      }
    ],
    "createdAt": "2026-01-16T10:00:00Z",
    "completedAt": null,
    "closedAt": null
  }
}
```

---

### 2.4 更新订单

**端点**: `PUT /api/orders/{id}`

**认证**: 需要

**权限**: `orders.update`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "deliveryAddress": "北京市朝阳区新地址",
  "remark": "更新备注"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| deliveryAddress | String | - | 配送地址 |
| remark | String | - | 备注 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "deliveryAddress": "北京市朝阳区新地址",
    "remark": "更新备注",
    "updatedAt": "2026-01-16T11:00:00Z"
  }
}
```

**注意**: 
- 仅允许修改非核心字段
- 禁止修改订单金额、商品明细等
- 状态变更需通过专用API

---

## 3. 订单锁定机制

### 3.1 锁定订单

**端点**: `POST /api/orders/{id}/lock`

**认证**: 需要

**权限**: `orders.lock`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "reason": "防止误操作"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| reason | String | ✓ | 锁定原因 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isLocked": true,
    "lockedBy": "uuid",
    "lockedAt": "2026-01-16T10:00:00Z"
  }
}
```

**业务规则**:
- 锁定后禁止修改订单明细
- 仅管理员可解锁
- 锁定原因会记录到操作日志

---

### 3.2 解锁订单

**端点**: `POST /api/orders/{id}/unlock`

**认证**: 需要

**权限**: `orders.unlock`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "reason": "需要修改订单明细"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| reason | String | ✓ | 解锁原因 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isLocked": false,
    "unlockedBy": "uuid",
    "unlockedAt": "2026-01-16T11:00:00Z"
  }
}
```

**业务规则**:
- 仅店长可解锁
- 解锁原因会记录到操作日志

---

## 4. 拆单API

### 4.1 拆单预览

**端点**: `POST /api/orders/{id}/split/preview`

**认证**: 需要

**权限**: `orders.split`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
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

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| items | Array | - | 商品列表(可选,不传则自动匹配) |
| items[].itemId | UUID | ✓ | 商品ID |
| items[].supplierId | UUID | - | 供应商ID(可选,不传则自动匹配) |
| items[].quantity | Decimal | ✓ | 数量 |

**响应示例**:
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

**业务规则**:
- 不传items则自动匹配最优供应商
- 运费按金额比例分摊
- 预览结果不会实际创建采购单

---

### 4.2 确认拆单

**端点**: `POST /api/orders/{id}/split/confirm`

**认证**: 需要

**权限**: `orders.split`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
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

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| purchaseOrders | Array | ✓ | 采购单列表 |
| purchaseOrders[].supplierId | UUID | ✓ | 供应商ID |
| purchaseOrders[].items | Array | ✓ | 商品列表 |
| purchaseOrders[].items[].itemId | UUID | ✓ | 商品ID |
| purchaseOrders[].items[].quantity | Decimal | ✓ | 数量 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "purchaseOrderIds": [
      "uuid",
      "uuid"
    ],
    "status": "PENDING_PRODUCTION",
    "createdAt": "2026-01-16T10:00:00Z"
  }
}
```

**业务规则**:
- 确认后会创建多个采购单
- 更新orderItems的supplierId和purchaseOrderId
- 订单状态根据商品类型流转

---

## 5. 发货API

### 5.1 申请发货

**端点**: `POST /api/orders/{id}/delivery/request`

**认证**: 需要

**权限**: `orders.delivery`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "deliveryAddress": "北京市朝阳区XXX小区",
  "scheduledDate": "2026-01-20"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| deliveryAddress | String | ✓ | 发货地址 |
| scheduledDate | Date | - | 预约发货日期 |

**响应示例**:
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

**业务规则**:
- 仅PENDING_DELIVERY状态可申请发货
- 所有商品必须已入库
- 库存检查失败则返回错误

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "ITEMS_NOT_IN_STOCK",
    "message": "部分商品未入库,无法发货",
    "details": [
      {
        "itemId": "uuid",
        "productName": "梦幻帘",
        "deliveryStatus": "PENDING"
      }
    ]
  }
}
```

---

### 5.2 确认发货

**端点**: `POST /api/orders/{id}/delivery/confirm`

**认证**: 需要

**权限**: `orders.delivery`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "logisticsCompany": "SF",
  "trackingNumber": "SF1234567890",
  "shippingFee": 280.00
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| logisticsCompany | String | ✓ | 物流公司代码(SF/DB/ZTO/YTO/STO/SELF_PICKUP) |
| trackingNumber | String | ✓ | 运单号 |
| shippingFee | Decimal | - | 运费 |

**响应示例**:
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

**业务规则**:
- 仅PENDING_SHIPMENT状态可确认发货
- 确认后自动订阅物流推送
- 订单状态变更为SHIPPED

---

## 6. 物流API

### 6.1 更新物流信息

**端点**: `PUT /api/orders/{id}/logistics`

**认证**: 需要

**权限**: `orders.update`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "logisticsCompany": "SF",
  "trackingNumber": "SF1234567890",
  "shippingFee": 280.00
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| logisticsCompany | String | ✓ | 物流公司代码 |
| trackingNumber | String | ✓ | 运单号 |
| shippingFee | Decimal | - | 运费 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "logisticsCompany": "SF",
    "trackingNumber": "SF1234567890",
    "shippingFee": 280.00,
    "updatedAt": "2026-01-16T11:00:00Z"
  }
}
```

---

### 6.2 查询物流轨迹

**端点**: `GET /api/orders/{id}/logistics-track`

**认证**: 需要

**权限**: `orders.read`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**响应示例**:
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
        "description": "快件到达上海浦东集散中心,准备派送"
      }
    ],
    "estimatedDelivery": "2026-01-23T18:00:00Z"
  }
}
```

**业务规则**:
- 对接快递100 SDK
- 实时查询物流状态
- 物流签收后自动更新订单状态

---

## 7. 变更单API

### 7.1 创建变更请求

**端点**: `POST /api/orders/{id}/change-requests`

**认证**: 需要

**权限**: `orders.update`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "changeType": "MODIFY_ITEM",
  "changeReason": "客户要求修改尺寸",
  "originalItems": [
    {
      "id": "uuid",
      "productName": "梦幻帘",
      "quantity": 1,
      "width": 2800,
      "height": 2500,
      "subtotal": 300.00
    }
  ],
  "newItems": [
    {
      "productId": "uuid",
      "productName": "梦幻帘",
      "quantity": 1,
      "width": 3000,
      "height": 2500,
      "subtotal": 320.00
    }
  ]
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| changeType | Enum | ✓ | 变更类型(ADD_ITEM/REMOVE_ITEM/MODIFY_ITEM) |
| changeReason | String | ✓ | 变更原因 |
| originalItems | Array | ✓ | 原始商品列表 |
| newItems | Array | ✓ | 新商品列表 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNo": "OD20260116001",
    "changeType": "MODIFY_ITEM",
    "priceDifference": "20.00",
    "status": "PENDING",
    "createdAt": "2026-01-16T10:00:00Z"
  }
}
```

**业务规则**:
- 仅PENDING_PO和PENDING_CONFIRMATION状态允许变更
- 自动计算差价
- 提交后进入审批流程

---

### 7.2 获取变更历史

**端点**: `GET /api/orders/{id}/change-requests`

**认证**: 需要

**权限**: `orders.read`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderNo": "OD20260116001",
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

---

### 7.3 审批变更请求

**端点**: `POST /api/change-requests/{id}/approve`

**认证**: 需要

**权限**: `orders.approve`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 变更请求ID |

**请求参数**:
```json
{
  "approved": true,
  "rejectionReason": "不符合业务规则"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| approved | Boolean | ✓ | 是否批准 |
| rejectionReason | String | - | 拒绝原因(approved=false时必填) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedBy": "uuid",
    "approvedAt": "2026-01-16T11:00:00Z",
    "appliedAt": "2026-01-16T11:00:01Z"
  }
}
```

**业务规则**:
- 仅店长可审批
- 审批通过后自动应用变更
- 审批拒绝则订单不受影响

---

### 7.4 拒绝变更请求

**端点**: `POST /api/change-requests/{id}/reject`

**认证**: 需要

**权限**: `orders.approve`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 变更请求ID |

**请求参数**:
```json
{
  "rejectionReason": "不符合业务规则"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| rejectionReason | String | ✓ | 拒绝原因 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejectedBy": "uuid",
    "rejectedAt": "2026-01-16T11:00:00Z",
    "rejectionReason": "不符合业务规则"
  }
}
```

---

## 8. 撤单API

### 8.1 申请撤单

**端点**: `POST /api/orders/{id}/cancel`

**认证**: 需要

**权限**: `orders.cancel`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "cancelReason": "客户取消订单",
  "cancelType": "FULL"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| cancelReason | String | ✓ | 撤单原因 |
| cancelType | Enum | ✓ | 撤单类型(FULL/PARTIAL) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelReason": "客户取消订单",
    "cancelledBy": "uuid",
    "cancelledAt": "2026-01-16T10:00:00Z"
  }
}
```

**业务规则**:
- PENDING_PO状态可直接撤单
- 其他状态需审批
- 审批通过后状态变更为CANCELLED

---

## 9. 叫停API

### 9.1 叫停订单

**端点**: `POST /api/orders/{id}/halt`

**认证**: 需要

**权限**: `orders.halt`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "haltedReason": "客户要求暂停",
  "haltType": "FULL"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| haltedReason | String | ✓ | 叫停原因 |
| haltType | Enum | ✓ | 叫停类型(FULL/PARTIAL) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "previousStatus": "PENDING_PRODUCTION",
    "status": "HALTED",
    "haltedReason": "客户要求暂停",
    "haltedAt": "2026-01-16T10:00:00Z"
  }
}
```

**业务规则**:
- 记录previous_status
- 记录halted_reason和halted_at
- 状态变更至HALTED
- 叫停最多7天,超过48小时自动恢复

---

### 9.2 恢复订单

**端点**: `POST /api/orders/{id}/resume`

**认证**: 需要

**权限**: `orders.halt`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| id | UUID | ✓ | 订单ID |

**请求参数**:
```json
{
  "resumeReason": "客户确认恢复"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| resumeReason | String | ✓ | 恢复原因 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING_PRODUCTION",
    "haltedReason": null,
    "haltedAt": null,
    "resumedAt": "2026-01-16T11:00:00Z"
  }
}
```

**业务规则**:
- 恢复至previous_status
- 清空halted_reason和halted_at
- 记录恢复操作到日志

---

## 10. 错误处理

### 10.1 标准错误响应

所有API错误响应遵循统一格式:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 10.2 错误码列表

| 错误码 | HTTP状态码 | 说明 |
|:---|:---:|:---|
| **通用错误** |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| **订单错误** |
| ORDER_NOT_FOUND | 404 | 订单不存在 |
| ORDER_INVALID_STATUS | 400 | 订单状态无效 |
| ORDER_LOCKED | 400 | 订单已锁定 |
| **报价单错误** |
| QUOTE_NOT_FOUND | 404 | 报价单不存在 |
| QUOTE_NOT_WON | 400 | 报价单状态不是WON |
| ORDER_ALREADY_EXISTS | 400 | 该报价单已创建订单 |
| **库存错误** |
| ITEMS_NOT_IN_STOCK | 400 | 部分商品未入库 |
| INSUFFICIENT_STOCK | 400 | 库存不足 |
| **变更单错误** |
| CHANGE_REQUEST_NOT_FOUND | 404 | 变更请求不存在 |
| CHANGE_REQUEST_ALREADY_PROCESSED | 400 | 变更请求已处理 |
| INVALID_CHANGE_TYPE | 400 | 无效的变更类型 |
| **物流错误** |
| LOGISTICS_API_ERROR | 500 | 物流API调用失败 |
| INVALID_TRACKING_NUMBER | 400 | 无效的运单号 |
| **撤单错误** |
| CANNOT_CANCEL_ORDER | 400 | 当前状态不允许撤单 |
| CANCEL_APPROVAL_REQUIRED | 400 | 需要撤单审批 |

### 10.3 错误处理最佳实践

**后端**:
- 使用try-catch捕获所有异常
- 记录详细错误日志
- 返回用户友好的错误信息
- 敏感信息不暴露给前端

**前端**:
- 根据错误码显示友好提示
- 401错误跳转登录页
- 403错误显示权限不足
- 500错误显示系统繁忙
- 网络错误提供重试按钮

---

## 11. 权限控制

### 11.1 权限定义

| 权限 | 说明 |
|:---|:---|
| orders.read | 查看订单 |
| orders.create | 创建订单 |
| orders.update | 修改订单 |
| orders.delete | 删除订单 |
| orders.lock | 锁定订单 |
| orders.unlock | 解锁订单 |
| orders.split | 拆单操作 |
| orders.delivery | 发货操作 |
| orders.approve | 审批变更 |
| orders.cancel | 撤单操作 |
| orders.halt | 叫停操作 |

### 11.2 角色权限矩阵

| 操作 | 销售 | 客服 | 采购员 | 财务 | 店长 |
|:---|:---:|:---:|:---:|:---:|:---:|
| 查看订单 | ✓(本人) | ✓ | ✓ | ✓ | ✓ |
| 创建订单 | ✓ | ✓ | ✗ | ✗ | ✓ |
| 修改订单 | ✓(本人) | ✗ | ✗ | ✗ | ✓ |
| 锁定订单 | ✗ | ✗ | ✗ | ✗ | ✓ |
| 解锁订单 | ✗ | ✗ | ✗ | ✗ | ✓ |
| 拆单操作 | ✗ | ✓ | ✗ | ✗ | ✓ |
| 发货操作 | ✓ | ✓ | ✗ | ✗ | ✓ |
| 审批变更 | ✗ | ✗ | ✗ | ✗ | ✓ |
| 撤单操作 | ✓(待下单) | ✗ | ✗ | ✗ | ✓ |
| 叫停操作 | ✗ | ✗ | ✗ | ✗ | ✓ |

### 11.3 数据范围权限

| 角色 | 可见范围 |
|:---|:---|
| 销售 | 自己负责的订单 |
| 客服/采购员/财务 | 全部订单 |
| 店长 | 本店所有订单 |

### 11.4 权限验证实现

**后端中间件**:
```typescript
import { getTenantId, getUserId, getUserRole } from '@/lib/auth';

export function requirePermission(permission: string) {
  return async (ctx: any) => {
    const userId = getUserId();
    const role = getUserRole();
    
    // 检查用户是否有该权限
    const hasPermission = await checkPermission(userId, permission);
    
    if (!hasPermission) {
      throw new Error('FORBIDDEN');
    }
  };
}
```

**前端权限控制**:
```typescript
import { useAuth } from '@/hooks/use-auth';

export function usePermission(permission: string) {
  const { user } = useAuth();
  
  return user?.permissions?.includes(permission) || false;
}

// 使用示例
function OrderActions() {
  const canCancel = usePermission('orders.cancel');
  
  return (
    <Button disabled={!canCancel}>
      撤单
    </Button>
  );
}
```

---

## 12. 附录

### 12.1 数据模型

**订单状态枚举**:
```typescript
type OrderStatus =
  | 'PENDING_CONFIRMATION'  // 待确认深化图
  | 'PENDING_PO'            // 待下采购单
  | 'PENDING_PRODUCTION'    // 生产中
  | 'PENDING_DELIVERY'      // 待申请发货
  | 'PENDING_SHIPMENT'      // 待发货
  | 'SHIPPED'               // 已发货
  | 'DELIVERED'             // 已送达
  | 'COMPLETED'             // 已完成
  | 'HALTED'                // 已叫停
  | 'CANCELLED';            // 已取消
```

**变更类型枚举**:
```typescript
type ChangeType =
  | 'ADD_ITEM'      // 新增商品
  | 'REMOVE_ITEM'   // 删除商品
  | 'MODIFY_ITEM';  // 修改商品
```

**物流公司代码**:
```typescript
type LogisticsCompany =
  | 'SF'           // 顺丰速运
  | 'DB'           // 德邦快递
  | 'ZTO'          // 中通快递
  | 'YTO'          // 圆通速递
  | 'STO'          // 申通快递
  | 'SELF_PICKUP';  // 自提
```

### 12.2 API测试用例

**创建订单测试**:
```typescript
describe('POST /api/orders', () => {
  it('should create order from quote', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        quoteId: 'uuid',
        paymentAmount: 3000,
        paymentMethod: 'WECHAT',
        paymentProofImg: 'https://oss.example.com/payment-proof.jpg',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('PENDING_PO');
  });

  it('should reject if quote is not WON', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        quoteId: 'uuid',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('QUOTE_NOT_WON');
  });
});
```

---

**文档结束**
