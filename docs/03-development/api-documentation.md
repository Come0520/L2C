# API接口文档 - 报价模块

> **文档版本**: v1.0  
> **创建日期**: 2026-01-16  
> **优先级**: P1 (API规范)  
> **预估工时**: 1天  
> **依赖**: 所有技术设计文档

---

## 📋 概述

本文档定义报价模块的所有API接口,包括配置管理、报价CRUD、版本管理、计算引擎等。

---

## 🏗️ API架构

### 基础URL

```
开发环境: http://localhost:3000/api
生产环境: https://api.example.com/api
```

### 认证方式

所有API请求需要在Header中包含认证token:

```http
Authorization: Bearer {token}
```

### 响应格式

#### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

#### 错误响应

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

---

## 🔧 配置管理API

### 1. 获取报价配置

获取当前用户的报价配置(三级优先级)。

**请求**

```http
GET /api/quote-config
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "config": {
      "defaultMode": "SIMPLE",
      "simpleModeFields": [
        "roomType",
        "productSku",
        "imageUrl",
        "width",
        "height",
        "openingStyle",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "advancedModeFields": [
        "roomType",
        "productSku",
        "imageUrl",
        "width",
        "height",
        "openingStyle",
        "installPosition",
        "groundClearance",
        "foldRatio",
        "fabricDirection",
        "headerProcessType",
        "trackAdjustment",
        "quantity",
        "unitPrice",
        "amount",
        "remark",
        "attachments"
      ],
      "fieldGroups": {
        "basic": {
          "label": "Basic Info",
          "fields": ["roomType", "productSku", "imageUrl"]
        },
        "dimension": {
          "label": "Dimensions",
          "fields": ["width", "height", "openingStyle", "installPosition", "groundClearance", "foldRatio"]
        },
        "price": {
          "label": "Price & Calculation",
          "fields": ["quantity", "unitPrice", "amount"]
        }
      },
      "defaultValues": {
        "installPosition": "CURTAIN_BOX",
        "groundClearance": 2,
        "foldRatio": 2.0
      },
      "validationRules": {
        "width": {
          "required": true,
          "min": 10,
          "max": 1000
        },
        "height": {
          "required": true,
          "min": 10,
          "max": 500
        }
      },
      "allowUserCustomization": true,
      "updatedAt": "2026-01-16T10:00:00Z"
    },
    "source": "USER"
  }
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---

### 2. 更新租户配置

租户管理员更新租户级报价配置。

**请求**

```http
PUT /api/tenant/quote-config
Authorization: Bearer {token}
Content-Type: application/json

{
  "defaultMode": "SIMPLE",
  "simpleModeFields": [
    "roomType",
    "productSku",
    "imageUrl",
    "width",
    "height",
    "openingStyle",
    "quantity",
    "unitPrice",
    "amount"
  ],
  "advancedModeFields": [
    "roomType",
    "productSku",
    "imageUrl",
    "width",
    "height",
    "openingStyle",
    "installPosition",
    "groundClearance",
    "foldRatio",
    "quantity",
    "unitPrice",
    "amount"
  ],
  "fieldGroups": {
    "basic": {
      "label": "Basic Info",
      "fields": ["roomType", "productSku", "imageUrl"]
    }
  },
  "defaultValues": {
    "installPosition": "CURTAIN_BOX",
    "groundClearance": 2,
    "foldRatio": 2.0
  },
  "validationRules": {
    "width": {
      "required": true,
      "min": 10,
      "max": 1000
    }
  },
  "allowUserCustomization": true
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "config": {
      "defaultMode": "SIMPLE",
      "simpleModeFields": [
        "roomType",
        "productSku",
        "imageUrl",
        "width",
        "height",
        "openingStyle",
        "quantity",
        "unitPrice",
        "amount"
      ],
      "allowUserCustomization": true,
      "updatedAt": "2026-01-16T11:00:00Z"
    }
  }
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only tenant admin can update tenant config"
  }
}
```

---

### 3. 更新用户配置

用户更新个人报价配置偏好。

**请求**

```http
PUT /api/user/quote-config
Authorization: Bearer {token}
Content-Type: application/json

{
  "preferredMode": "SIMPLE",
  "customizedFields": [
    "roomType",
    "productSku",
    "imageUrl",
    "width",
    "height",
    "openingStyle",
    "quantity",
    "unitPrice",
    "amount",
    "installPosition"
  ],
  "useSystemDefault": false
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "config": {
      "preferredMode": "SIMPLE",
      "customizedFields": [
        "roomType",
        "productSku",
        "imageUrl",
        "width",
        "height",
        "openingStyle",
        "quantity",
        "unitPrice",
        "amount",
        "installPosition"
      ],
      "useSystemDefault": false,
      "updatedAt": "2026-01-16T12:00:00Z"
    }
  }
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Tenant does not allow user customization"
  }
}
```

---

## 📄 报价CRUD API

### 4. 创建报价单

创建新的报价单。

**请求**

```http
POST /api/quotes
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "uuid",
  "leadId": "uuid",
  "title": "Living Room Curtains",
  "validUntil": "2026-02-16T23:59:59Z",
  "notes": "Customer prefers dark colors"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "quote": {
      "id": "uuid",
      "quoteNo": "Q20260116-001",
      "customerId": "uuid",
      "leadId": "uuid",
      "title": "Living Room Curtains",
      "totalAmount": "0.00",
      "discountRate": "1.0000",
      "discountAmount": "0.00",
      "finalAmount": "0.00",
      "status": "DRAFT",
      "version": 1,
      "isActive": true,
      "validUntil": "2026-02-16T23:59:59Z",
      "notes": "Customer prefers dark colors",
      "createdAt": "2026-01-16T10:00:00Z",
      "updatedAt": "2026-01-16T10:00:00Z"
    }
  }
}
```

---

### 5. 获取报价单详情

获取指定报价单的完整信息。

**请求**

```http
GET /api/quotes/{quoteId}
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "quote": {
      "id": "uuid",
      "quoteNo": "Q20260116-001",
      "customerId": "uuid",
      "customer": {
        "id": "uuid",
        "name": "John Doe",
        "phone": "13800138000"
      },
      "totalAmount": "5000.00",
      "discountRate": "0.9500",
      "discountAmount": "250.00",
      "finalAmount": "4750.00",
      "status": "DRAFT",
      "version": 1,
      "isActive": true,
      "validUntil": "2026-02-16T23:59:59Z",
      "notes": "Customer prefers dark colors",
      "createdAt": "2026-01-16T10:00:00Z",
      "updatedAt": "2026-01-16T10:00:00Z"
    },
    "items": [
      {
        "id": "uuid",
        "roomId": "uuid",
        "roomName": "Living Room",
        "category": "CURTAIN_FABRIC",
        "productId": "uuid",
        "productName": "Premium Velvet",
        "productSku": "PV-001",
        "unit": "米",
        "unitPrice": "100.00",
        "quantity": "4.20",
        "width": "200.00",
        "height": "250.00",
        "foldRatio": "2.00",
        "subtotal": "420.00",
        "attributes": {
          "openingStyle": "DOUBLE",
          "installPosition": "CURTAIN_BOX",
          "groundClearance": 2,
          "foldRatio": 2.0,
          "fabricWidth": 280,
          "material": "Velvet",
          "imageUrl": "https://example.com/image.jpg"
        },
        "calculationParams": {
          "formulaType": "FIXED_HEIGHT",
          "calculatedAt": "2026-01-16T10:00:00Z",
          "calcVersion": "1.0.0",
          "sideLoss": 5,
          "headerLoss": 20,
          "bottomLoss": 10,
          "finishedWidth": 400,
          "finishedHeight": 248,
          "cutWidth": 420,
          "cutHeight": 278,
          "warnings": []
        },
        "sortOrder": 0,
        "attachments": []
      }
    ],
    "rooms": [
      {
        "id": "uuid",
        "name": "Living Room",
        "sortOrder": 0
      }
    ]
  }
}
```

---

### 6. 更新报价单

更新报价单基本信息。

**请求**

```http
PUT /api/quotes/{quoteId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Living Room Curtains (Updated)",
  "validUntil": "2026-02-28T23:59:59Z",
  "notes": "Updated notes"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "quote": {
      "id": "uuid",
      "title": "Living Room Curtains (Updated)",
      "validUntil": "2026-02-28T23:59:59Z",
      "notes": "Updated notes",
      "updatedAt": "2026-01-16T11:00:00Z"
    }
  }
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot edit ACTIVE version. Please create a new version first."
  }
}
```

---

### 7. 删除报价单

删除指定报价单。

**请求**

```http
DELETE /api/quotes/{quoteId}
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## 🔄 版本管理API

### 8. 创建新版本

创建报价单的新版本。

**请求**

```http
POST /api/quotes/{quoteId}/versions
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "newVersion": {
      "id": "uuid",
      "quoteNo": "Q20260116-001-V2",
      "version": 2,
      "parentQuoteId": "uuid",
      "isActive": true,
      "status": "DRAFT",
      "createdAt": "2026-01-16T12:00:00Z"
    },
    "oldVersion": {
      "id": "uuid",
      "quoteNo": "Q20260116-001",
      "version": 1,
      "isActive": false,
      "status": "DRAFT"
    }
  }
}
```

---

### 9. 激活版本

激活指定版本。

**请求**

```http
PUT /api/quotes/{quoteId}/activate
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "activatedVersion": {
      "id": "uuid",
      "quoteNo": "Q20260116-001",
      "version": 2,
      "isActive": true,
      "updatedAt": "2026-01-16T13:00:00Z"
    },
    "deactivatedVersion": {
      "id": "uuid",
      "quoteNo": "Q20260116-001",
      "version": 3,
      "isActive": false,
      "updatedAt": "2026-01-16T13:00:00Z"
    }
  }
}
```

---

### 10. 查询版本历史

查询报价单的版本历史。

**请求**

```http
GET /api/quotes/{quoteId}/versions
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "uuid",
        "quoteNo": "Q20260116-001-V3",
        "version": 3,
        "parentQuoteId": "uuid",
        "isActive": true,
        "status": "DRAFT",
        "finalAmount": "4800.00",
        "createdAt": "2026-01-16T14:00:00Z",
        "updatedAt": "2026-01-16T14:00:00Z"
      },
      {
        "id": "uuid",
        "quoteNo": "Q20260116-001-V2",
        "version": 2,
        "parentQuoteId": "uuid",
        "isActive": false,
        "status": "DRAFT",
        "finalAmount": "4750.00",
        "createdAt": "2026-01-16T12:00:00Z",
        "updatedAt": "2026-01-16T13:00:00Z"
      },
      {
        "id": "uuid",
        "quoteNo": "Q20260116-001",
        "version": 1,
        "parentQuoteId": null,
        "isActive": false,
        "status": "DRAFT",
        "finalAmount": "5000.00",
        "createdAt": "2026-01-16T10:00:00Z",
        "updatedAt": "2026-01-16T12:00:00Z"
      }
    ]
  }
}
```

---

### 11. 归档版本

归档指定版本。

**请求**

```http
PUT /api/quotes/{quoteId}/archive
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "archivedVersion": {
      "id": "uuid",
      "quoteNo": "Q20260116-001",
      "version": 1,
      "isActive": false,
      "status": "ARCHIVED",
      "updatedAt": "2026-01-16T15:00:00Z"
    }
  }
}
```

---

## 🧮 计算引擎API

### 12. 计算报价项

计算单个报价项的用量和金额。

**请求**

```http
POST /api/quotes/calculate
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "CURTAIN_FABRIC",
  "input": {
    "measuredWidth": 200,
    "measuredHeight": 250,
    "foldRatio": 2.0,
    "groundClearance": 2,
    "headerProcessType": "WRAPPED",
    "fabricDirection": "HEIGHT",
    "fabricSize": 280,
    "openingStyle": "DOUBLE",
    "unitPrice": 100
  }
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "result": {
      "finishedWidth": 400,
      "finishedHeight": 248,
      "cutWidth": 420,
      "cutHeight": 278,
      "quantity": 4.2,
      "subtotal": 420,
      "panelCount": 1,
      "warnings": []
    }
  }
}
```

---

### 13. 批量计算

批量计算多个报价项。

**请求**

```http
POST /api/quotes/calculate/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "category": "CURTAIN_FABRIC",
      "input": {
        "measuredWidth": 200,
        "measuredHeight": 250,
        "foldRatio": 2.0,
        "groundClearance": 2,
        "headerProcessType": "WRAPPED",
        "fabricDirection": "HEIGHT",
        "fabricSize": 280,
        "openingStyle": "DOUBLE",
        "unitPrice": 100
      }
    },
    {
      "category": "WALLPAPER",
      "input": {
        "width": 400,
        "height": 260,
        "fabricWidth": 53,
        "unitPrice": 50,
        "rollLength": 10,
        "patternRepeat": 0
      }
    }
  ]
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "category": "CURTAIN_FABRIC",
        "result": {
          "finishedWidth": 400,
          "finishedHeight": 248,
          "cutWidth": 420,
          "cutHeight": 278,
          "quantity": 4.2,
          "subtotal": 420,
          "panelCount": 1,
          "warnings": []
        }
      },
      {
        "category": "WALLPAPER",
        "result": {
          "usage": 3,
          "subtotal": 150,
          "details": {
            "totalStrips": 8,
            "effectiveHeightCm": 280
          }
        }
      }
    ]
  }
}
```

---

## 📦 报价项管理API

### 14. 添加报价项

向报价单添加新项。

**请求**

```http
POST /api/quotes/{quoteId}/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "roomId": "uuid",
  "roomName": "Living Room",
  "category": "CURTAIN_FABRIC",
  "productId": "uuid",
  "productName": "Premium Velvet",
  "productSku": "PV-001",
  "unit": "米",
  "unitPrice": "100.00",
  "quantity": "4.20",
  "width": "200.00",
  "height": "250.00",
  "foldRatio": "2.00",
  "attributes": {
    "openingStyle": "DOUBLE",
    "installPosition": "CURTAIN_BOX",
    "groundClearance": 2,
    "foldRatio": 2.0,
    "fabricWidth": 280,
    "material": "Velvet",
    "imageUrl": "https://example.com/image.jpg"
  },
  "sortOrder": 0
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "item": {
      "id": "uuid",
      "roomId": "uuid",
      "roomName": "Living Room",
      "category": "CURTAIN_FABRIC",
      "productId": "uuid",
      "productName": "Premium Velvet",
      "productSku": "PV-001",
      "unit": "米",
      "unitPrice": "100.00",
      "quantity": "4.20",
      "width": "200.00",
      "height": "250.00",
      "foldRatio": "2.00",
      "subtotal": "420.00",
      "attributes": {
        "openingStyle": "DOUBLE",
        "installPosition": "CURTAIN_BOX",
        "groundClearance": 2,
        "foldRatio": 2.0,
        "fabricWidth": 280,
        "material": "Velvet",
        "imageUrl": "https://example.com/image.jpg"
      },
      "calculationParams": {
        "formulaType": "FIXED_HEIGHT",
        "calculatedAt": "2026-01-16T10:00:00Z",
        "calcVersion": "1.0.0",
        "sideLoss": 5,
        "headerLoss": 20,
        "bottomLoss": 10,
        "finishedWidth": 400,
        "finishedHeight": 248,
        "cutWidth": 420,
        "cutHeight": 278,
        "warnings": []
      },
      "sortOrder": 0,
      "createdAt": "2026-01-16T10:00:00Z"
    }
  }
}
```

---

### 15. 更新报价项

更新指定报价项。

**请求**

```http
PUT /api/quotes/{quoteId}/items/{itemId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": "5.00",
  "unitPrice": "110.00",
  "attributes": {
    "openingStyle": "DOUBLE",
    "installPosition": "CURTAIN_BOX",
    "groundClearance": 2,
    "foldRatio": 2.0,
    "fabricWidth": 280,
    "material": "Velvet"
  }
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "item": {
      "id": "uuid",
      "quantity": "5.00",
      "unitPrice": "110.00",
      "subtotal": "550.00",
      "updatedAt": "2026-01-16T11:00:00Z"
    }
  }
}
```

---

### 16. 删除报价项

删除指定报价项。

**请求**

```http
DELETE /api/quotes/{quoteId}/items/{itemId}
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## 📦 空间管理API

### 17. 添加空间

向报价单添加新空间。

**请求**

```http
POST /api/quotes/{quoteId}/rooms
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Living Room",
  "measureRoomId": "uuid",
  "sortOrder": 0
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "room": {
      "id": "uuid",
      "name": "Living Room",
      "measureRoomId": "uuid",
      "sortOrder": 0,
      "createdAt": "2026-01-16T10:00:00Z"
    }
  }
}
```

---

### 18. 更新空间

更新指定空间。

**请求**

```http
PUT /api/quotes/{quoteId}/rooms/{roomId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Living Room (Updated)",
  "sortOrder": 1
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "room": {
      "id": "uuid",
      "name": "Living Room (Updated)",
      "sortOrder": 1,
      "updatedAt": "2026-01-16T11:00:00Z"
    }
  }
}
```

---

### 19. 删除空间

删除指定空间。

**请求**

```http
DELETE /api/quotes/{quoteId}/rooms/{roomId}
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## 🔄 订单流转API

### 20. 转订单

将报价单转换为订单。

**请求**

```http
POST /api/quotes/{quoteId}/convert-to-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "deliveryAddress": "123 Main St, City, State 12345",
  "settlementType": "CASH",
  "paymentAmount": "2375.00",
  "paymentMethod": "CASH",
  "remark": "Customer requested expedited delivery"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "orderNo": "ORD-20260116-001",
      "quoteId": "uuid",
      "quoteVersionId": "uuid",
      "customerId": "uuid",
      "customerName": "John Doe",
      "customerPhone": "13800138000",
      "deliveryAddress": "123 Main St, City, State 12345",
      "totalAmount": "4750.00",
      "paidAmount": "2375.00",
      "balanceAmount": "2375.00",
      "settlementType": "CASH",
      "paymentAmount": "2375.00",
      "paymentMethod": "CASH",
      "paymentTime": "2026-01-16T10:00:00Z",
      "status": "DRAFT",
      "quoteSnapshot": {
        "quote": {
          "id": "uuid",
          "quoteNo": "Q20260116-001",
          "version": 1,
          "finalAmount": "4750.00"
        },
        "items": [
          {
            "id": "uuid",
            "productName": "Premium Velvet",
            "productSku": "PV-001",
            "unitPrice": "100.00",
            "quantity": "4.20",
            "subtotal": "420.00",
            "attributes": { ... },
            "calculationParams": { ... }
          }
        ],
        "rooms": [
          {
            "id": "uuid",
            "name": "Living Room",
            "sortOrder": 0
          }
        ],
        "metadata": {
          "timestamp": "2026-01-16T10:00:00Z",
          "version": "1.0.0",
          "createdBy": "uuid"
        }
      },
      "createdAt": "2026-01-16T10:00:00Z"
    }
  }
}
```

---

## 📋 报价单列表API

### 21. 查询报价单列表

查询报价单列表,支持分页和筛选。

**请求**

```http
GET /api/quotes?page=1&pageSize=20&status=DRAFT&customerId={customerId}
Authorization: Bearer {token}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码,默认1 |
| pageSize | number | 否 | 每页数量,默认20 |
| status | string | 否 | 状态筛选 |
| customerId | string | 否 | 客户ID筛选 |
| keyword | string | 否 | 关键词搜索 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应**

```json
{
  "success": true,
  "data": {
    "quotes": [
      {
        "id": "uuid",
        "quoteNo": "Q20260116-001",
        "customerId": "uuid",
        "customerName": "John Doe",
        "title": "Living Room Curtains",
        "totalAmount": "5000.00",
        "finalAmount": "4750.00",
        "status": "DRAFT",
        "version": 1,
        "isActive": true,
        "validUntil": "2026-02-16T23:59:59Z",
        "createdAt": "2026-01-16T10:00:00Z",
        "updatedAt": "2026-01-16T10:00:00Z"
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

---

## ❌ 错误码

| 错误码 | 说明 |
|--------|------|
| `UNAUTHORIZED` | 未授权或token无效 |
| `FORBIDDEN` | 无权限访问 |
| `NOT_FOUND` | 资源不存在 |
| `VALIDATION_ERROR` | 请求参数验证失败 |
| `CONFLICT` | 资源冲突(如重复ACTIVE版本) |
| `INTERNAL_ERROR` | 服务器内部错误 |

---

## 🔗 相关文档

- [数据库迁移计划](./database-migration-plan.md)
- [TypeScript类型定义](./typescript-type-definitions.md)
- [计算引擎技术设计](./quote-calculation-engine.md)
- [版本管理技术设计](./quote-version-management.md)
- [报价模式配置技术设计](./quote-mode-configuration.md)

---

**最后更新**: 2026-01-16  
**维护者**: 开发团队
