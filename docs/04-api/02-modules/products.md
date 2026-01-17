# 商品模块 API

> 商品模块提供商品管理、商品分类管理、商品属性模板管理、商品供应商关联管理等功能，支持商品全生命周期管理。

## 概述

商品模块是 L2C 系统的核心模块之一，负责管理所有商品信息。系统支持商品管理、商品分类管理、商品属性模板管理、商品供应商关联管理、商品定价管理等功能。

### 核心功能

- 商品管理（创建、查询、更新、删除）
- 商品分类管理
- 商品属性模板管理
- 商品供应商关联管理
- 商品定价管理
- 商品上架/下架
- 商品库存管理

---

## 1. 创建商品

创建新商品。

### 接口信息
- **URL**: `POST /api/v1/products`
- **认证**: 需要
- **权限**: `products.create`

### 请求参数

```json
{
  "sku": "CL001",
  "name": "窗帘",
  "category": "CURTAIN",
  "unit": "件",
  "purchasePrice": 500,
  "logisticsCost": 20,
  "processingCost": 30,
  "lossRate": 0.05,
  "retailPrice": 1000,
  "channelPriceMode": "FIXED",
  "channelPrice": 800,
  "channelDiscountRate": 1,
  "floorPrice": 600,
  "isToBEnabled": true,
  "isToCEnabled": true,
  "defaultSupplierId": "uuid",
  "isStockable": true,
  "attributes": {
    "width": 200,
    "height": 150,
    "color": "白色"
  },
  "description": "高品质窗帘"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sku | string | 是 | 商品 SKU（唯一） |
| name | string | 是 | 商品名称 |
| category | string | 是 | 商品分类：CURTAIN/WALLPAPER/WALLCLOTH/MATTRESS/OTHER/CURTAIN_FABRIC/CURTAIN_SHEER/CURTAIN_TRACK/MOTOR/CURTAIN_ACCESSORY |
| unit | string | 否 | 单位，默认 件 |
| purchasePrice | number | 是 | 采购价 |
| logisticsCost | number | 否 | 物流成本 |
| processingCost | number | 否 | 加工成本 |
| lossRate | number | 否 | 损耗率（0-1），默认 0.05 |
| retailPrice | number | 是 | 零售价 |
| channelPriceMode | string | 否 | 渠道价格模式：FIXED/DISCOUNT，默认 FIXED |
| channelPrice | number | 否 | 渠道价格 |
| channelDiscountRate | number | 否 | 渠道折扣率（0-1），默认 1 |
| floorPrice | number | 是 | 底价 |
| isToBEnabled | boolean | 否 | 是否启用 ToB，默认 true |
| isToCEnabled | boolean | 否 | 是否启用 ToC，默认 true |
| defaultSupplierId | string | 否 | 默认供应商 ID |
| isStockable | boolean | 否 | 是否可库存，默认 false |
| attributes | object | 否 | 商品属性 |
| description | string | 否 | 商品描述 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "sku": "CL001",
    "name": "窗帘",
    "category": "CURTAIN",
    "unit": "件",
    "purchasePrice": "500.00",
    "logisticsCost": "20.00",
    "processingCost": "30.00",
    "lossRate": "0.0500",
    "retailPrice": "1000.00",
    "channelPriceMode": "FIXED",
    "channelPrice": "800.00",
    "channelDiscountRate": "1.0000",
    "floorPrice": "600.00",
    "isToBEnabled": true,
    "isToCEnabled": true,
    "defaultSupplierId": "uuid",
    "isStockable": true,
    "specs": {
      "width": 200,
      "height": 150,
      "color": "白色"
    },
    "description": "高品质窗帘",
    "isActive": true,
    "createdBy": "uuid",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **SKU 唯一性**：SKU 在租户内必须唯一
2. **价格验证**：底价不能高于渠道价，渠道价不能高于零售价
3. **初始状态**：新商品默认为活跃状态

---

## 2. 查询商品列表

分页查询商品列表，支持多条件筛选和搜索。

### 接口信息
- **URL**: `GET /api/v1/products`
- **认证**: 需要
- **权限**: `products.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| search | string | 否 | 搜索关键词（商品名称/SKU） |
| category | string | 否 | 商品分类 |
| isActive | boolean | 否 | 是否活跃 |
| isToBEnabled | boolean | 否 | 是否启用 ToB |
| isToCEnabled | boolean | 否 | 是否启用 ToC |
| defaultSupplierId | string | 否 | 默认供应商 ID |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "CL001",
      "name": "窗帘",
      "category": "CURTAIN",
      "unit": "件",
      "purchasePrice": "500.00",
      "retailPrice": "1000.00",
      "channelPrice": "800.00",
      "floorPrice": "600.00",
      "isActive": true,
      "isToBEnabled": true,
      "isToCEnabled": true,
      "supplier": {
        "id": "uuid",
        "name": "深圳窗帘厂"
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

## 3. 查询商品详情

根据商品 ID 查询商品详细信息。

### 接口信息
- **URL**: `GET /api/v1/products/{id}`
- **认证**: 需要
- **权限**: `products.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 商品 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "sku": "CL001",
    "name": "窗帘",
    "category": "CURTAIN",
    "unit": "件",
    "purchasePrice": "500.00",
    "logisticsCost": "20.00",
    "processingCost": "30.00",
    "lossRate": "0.0500",
    "retailPrice": "1000.00",
    "channelPriceMode": "FIXED",
    "channelPrice": "800.00",
    "channelDiscountRate": "1.0000",
    "floorPrice": "600.00",
    "isToBEnabled": true,
    "isToCEnabled": true,
    "defaultSupplierId": "uuid",
    "isStockable": true,
    "specs": {
      "width": 200,
      "height": 150,
      "color": "白色"
    },
    "description": "高品质窗帘",
    "isActive": true,
    "createdBy": "uuid",
    "creator": {
      "id": "uuid",
      "name": "王五"
    },
    "supplier": {
      "id": "uuid",
      "name": "深圳窗帘厂",
      "phone": "13800138001"
    },
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## 4. 更新商品

更新商品信息。

### 接口信息
- **URL**: `PUT /api/v1/products/{id}`
- **认证**: 需要
- **权限**: `products.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 商品 ID |

### 请求参数

```json
{
  "name": "窗帘（升级版）",
  "purchasePrice": 550,
  "retailPrice": 1100,
  "channelPrice": 880,
  "floorPrice": 660,
  "attributes": {
    "width": 200,
    "height": 150,
    "color": "米色"
  },
  "description": "高品质窗帘，升级版"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 商品名称 |
| category | string | 否 | 商品分类 |
| unit | string | 否 | 单位 |
| purchasePrice | number | 否 | 采购价 |
| logisticsCost | number | 否 | 物流成本 |
| processingCost | number | 否 | 加工成本 |
| lossRate | number | 否 | 损耗率 |
| retailPrice | number | 否 | 零售价 |
| channelPriceMode | string | 否 | 渠道价格模式 |
| channelPrice | number | 否 | 渠道价格 |
| channelDiscountRate | number | 否 | 渠道折扣率 |
| floorPrice | number | 否 | 底价 |
| isToBEnabled | boolean | 否 | 是否启用 ToB |
| isToCEnabled | boolean | 否 | 是否启用 ToC |
| defaultSupplierId | string | 否 | 默认供应商 ID |
| isStockable | boolean | 否 | 是否可库存 |
| attributes | object | 否 | 商品属性 |
| description | string | 否 | 商品描述 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "CL001",
    "name": "窗帘（升级版）",
    "purchasePrice": "550.00",
    "retailPrice": "1100.00",
    "channelPrice": "880.00",
    "floorPrice": "660.00",
    "specs": {
      "width": 200,
      "height": 150,
      "color": "米色"
    },
    "description": "高品质窗帘，升级版",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **SKU 修改**：修改 SKU 时需要验证唯一性
2. **价格验证**：修改价格时验证价格关系

---

## 5. 删除商品

删除商品。

### 接口信息
- **URL**: `DELETE /api/v1/products/{id}`
- **认证**: 需要
- **权限**: `products.delete`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 商品 ID |

### 响应示例

```json
{
  "success": true,
  "message": "商品删除成功"
}
```

### 业务规则

1. **关联订单**：如果商品被订单引用，不允许删除
2. **关联报价**：如果商品被报价单引用，不允许删除

---

## 6. 上架/下架商品

上架或下架商品。

### 接口信息
- **URL**: `PUT /api/v1/products/{id}/activate`
- **认证**: 需要
- **权限**: `products.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 商品 ID |

### 请求参数

```json
{
  "isActive": true
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isActive | boolean | 是 | 是否活跃 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "CL001",
    "isActive": true,
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 7. 批量上架/下架商品

批量上架或下架商品。

### 接口信息
- **URL**: `PUT /api/v1/products/batch-activate`
- **认证**: 需要
- **权限**: `products.update`

### 请求参数

```json
{
  "productIds": ["uuid", "uuid"],
  "isActive": true
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productIds | array | 是 | 商品 ID 数组 |
| isActive | boolean | 是 | 是否活跃 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "updatedCount": 2
  }
}
```

---

## 8. 创建商品分类

创建商品分类。

### 接口信息
- **URL**: `POST /api/v1/products/categories`
- **认证**: 需要
- **权限**: `products.categories.create`

### 请求参数

```json
{
  "name": "窗帘",
  "code": "CURTAIN",
  "parentId": "uuid",
  "sortOrder": 1,
  "description": "窗帘类商品"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 |
| code | string | 是 | 分类代码（唯一） |
| parentId | string | 否 | 父分类 ID |
| sortOrder | integer | 否 | 排序序号 |
| description | string | 否 | 分类描述 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "窗帘",
    "code": "CURTAIN",
    "parentId": "uuid",
    "sortOrder": 1,
    "description": "窗帘类商品",
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## 9. 查询商品分类列表

查询商品分类列表。

### 接口信息
- **URL**: `GET /api/v1/products/categories`
- **认证**: 需要
- **权限**: `products.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isActive | boolean | 否 | 是否活跃 |
| parentId | string | 否 | 父分类 ID |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "窗帘",
      "code": "CURTAIN",
      "parentId": null,
      "sortOrder": 1,
      "isActive": true,
      "children": [
        {
          "id": "uuid",
          "name": "窗帘布",
          "code": "CURTAIN_FABRIC",
          "parentId": "uuid",
          "sortOrder": 1,
          "isActive": true
        }
      ]
    }
  ]
}
```

---

## 10. 创建商品属性模板

创建商品属性模板。

### 接口信息
- **URL**: `POST /api/v1/products/attribute-templates`
- **认证**: 需要
- **权限**: `products.attributes.create`

### 请求参数

```json
{
  "name": "窗帘属性模板",
  "category": "CURTAIN",
  "attributes": [
    {
      "key": "width",
      "label": "宽度",
      "type": "number",
      "required": true,
      "unit": "cm"
    },
    {
      "key": "height",
      "label": "高度",
      "type": "number",
      "required": true,
      "unit": "cm"
    },
    {
      "key": "color",
      "label": "颜色",
      "type": "select",
      "required": true,
      "options": ["白色", "米色", "灰色"]
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 模板名称 |
| category | string | 是 | 商品分类 |
| attributes | array | 是 | 属性数组 |

### attributes 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 属性键 |
| label | string | 是 | 属性标签 |
| type | string | 是 | 属性类型：text/number/select/boolean |
| required | boolean | 否 | 是否必填 |
| unit | string | 否 | 单位 |
| options | array | 否 | 选项（select 类型） |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "窗帘属性模板",
    "category": "CURTAIN",
    "attributes": [
      {
        "key": "width",
        "label": "宽度",
        "type": "number",
        "required": true,
        "unit": "cm"
      }
    ],
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## 11. 查询商品属性模板

查询商品属性模板列表。

### 接口信息
- **URL**: `GET /api/v1/products/attribute-templates`
- **认证**: 需要
- **权限**: `products.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 商品分类 |
| isActive | boolean | 否 | 是否活跃 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "窗帘属性模板",
      "category": "CURTAIN",
      "attributes": [
        {
          "key": "width",
          "label": "宽度",
          "type": "number",
          "required": true,
          "unit": "cm"
        }
      ],
      "isActive": true,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 12. 添加商品供应商关联

为商品添加供应商关联。

### 接口信息
- **URL**: `POST /api/v1/products/{id}/suppliers`
- **认证**: 需要
- **权限**: `products.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 商品 ID |

### 请求参数

```json
{
  "supplierId": "uuid",
  "isDefault": true,
  "purchasePrice": "500.00",
  "leadTime": 7
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| supplierId | string | 是 | 供应商 ID |
| isDefault | boolean | 否 | 是否默认供应商 |
| purchasePrice | string | 否 | 采购价 |
| leadTime | integer | 否 | 交货周期（天） |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "supplierId": "uuid",
    "isDefault": true,
    "purchasePrice": "500.00",
    "leadTime": 7,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **唯一性**：同一商品不能重复添加同一供应商
2. **默认供应商**：一个商品只能有一个默认供应商

---

## 13. 移除商品供应商关联

移除商品供应商关联。

### 接口信息
- **URL**: `DELETE /api/v1/products/{id}/suppliers/{supplierId}`
- **认证**: 需要
- **权限**: `products.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 商品 ID |
| supplierId | uuid | 是 | 供应商 ID |

### 响应示例

```json
{
  "success": true,
  "message": "供应商关联移除成功"
}
```

---

## 14. 设置默认供应商

设置商品的默认供应商。

### 接口信息
- **URL**: `PUT /api/v1/products/{id}/suppliers/{supplierId}/default`
- **认证**: 需要
- **权限**: `products.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 商品 ID |
| supplierId | uuid | 是 | 供应商 ID |

### 响应示例

```json
{
  "success": true,
  "message": "默认供应商设置成功"
}
```

---

## 15. 商品统计

获取商品统计数据。

### 接口信息
- **URL**: `GET /api/v1/products/statistics`
- **认证**: 需要
- **权限**: `products.read`

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
    "totalProducts": 1000,
    "activeProducts": 800,
    "inactiveProducts": 200,
    "categoryDistribution": {
      "CURTAIN": 300,
      "WALLPAPER": 200,
      "WALLCLOTH": 150,
      "MATTRESS": 100,
      "OTHER": 250
    },
    "priceRangeDistribution": {
      "0-100": 100,
      "100-500": 300,
      "500-1000": 400,
      "1000+": 200
    },
    "stockableProducts": 600,
    "nonStockableProducts": 400
  }
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| PRODUCT_NOT_FOUND | 404 | 商品不存在 |
| PRODUCT_ALREADY_EXISTS | 409 | 商品已存在 |
| PRODUCT_CANNOT_DELETE | 422 | 商品不能删除 |
| PRODUCT_INVALID_CATEGORY | 400 | 商品分类无效 |
| PRODUCT_INVALID_PRICE | 400 | 商品价格无效 |
| PRODUCT_INVALID_UNIT | 400 | 商品单位无效 |
| PRODUCT_SKU_DUPLICATE | 409 | 商品 SKU 重复 |
| PRODUCT_CATEGORY_NOT_FOUND | 404 | 商品分类不存在 |
| PRODUCT_ATTRIBUTE_TEMPLATE_NOT_FOUND | 404 | 商品属性模板不存在 |
| PRODUCT_SUPPLIER_NOT_FOUND | 404 | 商品供应商关联不存在 |
| PRODUCT_SUPPLIER_ALREADY_EXISTS | 409 | 商品供应商关联已存在 |

---

## 数据模型

### Product

```typescript
interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: 'CURTAIN' | 'WALLPAPER' | 'WALLCLOTH' | 'MATTRESS' | 'OTHER' | 'CURTAIN_FABRIC' | 'CURTAIN_SHEER' | 'CURTAIN_TRACK' | 'MOTOR' | 'CURTAIN_ACCESSORY';
  unit: string;
  purchasePrice: string;
  logisticsCost: string;
  processingCost: string;
  lossRate: string;
  retailPrice: string;
  channelPriceMode: 'FIXED' | 'DISCOUNT';
  channelPrice: string;
  channelDiscountRate: string;
  floorPrice: string;
  isToBEnabled: boolean;
  isToCEnabled: boolean;
  defaultSupplierId?: string;
  isStockable: boolean;
  specs: Record<string, any>;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ProductCategory

```typescript
interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  parentId?: string;
  sortOrder: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ProductAttributeTemplate

```typescript
interface ProductAttributeTemplate {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  attributes: ProductAttribute[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ProductAttribute

```typescript
interface ProductAttribute {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  unit?: string;
  options?: string[];
}
```

### ProductSupplier

```typescript
interface ProductSupplier {
  id: string;
  productId: string;
  supplierId: string;
  isDefault: boolean;
  purchasePrice?: string;
  leadTime?: number;
  createdAt: Date;
  updatedAt: Date;
}
```
