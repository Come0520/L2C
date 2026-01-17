# 客户管理 API

> 客户管理模块提供客户信息的创建、查询、更新、删除等功能，支持客户地址管理、客户合并、客户等级管理等。

## 概述

客户管理模块是 L2C 系统的核心模块之一，负责管理所有客户信息，包括个人客户和企业客户。系统支持客户查重、客户合并、客户等级管理、客户地址管理等功能。

### 核心功能

- 客户信息管理（创建、查询、更新、删除）
- 客户查重和合并
- 客户地址管理
- 客户等级管理
- 客户生命周期管理
- 客户推荐关系管理
- 客户积分管理

---

## 1. 创建客户

创建新客户，支持自动查重和默认地址创建。

### 接口信息
- **URL**: `POST /api/v1/customers`
- **认证**: 需要
- **权限**: `customers.create`

### 请求参数

```json
{
  "name": "张三",
  "phone": "13800138000",
  "phoneSecondary": "13900139000",
  "wechat": "wx123456",
  "gender": "MALE",
  "birthday": "1990-01-01",
  "type": "INDIVIDUAL",
  "level": "A",
  "notes": "VIP客户",
  "tags": ["VIP", "老客户"],
  "address": {
    "label": "默认",
    "province": "广东省",
    "city": "深圳市",
    "district": "南山区",
    "community": "阳光小区",
    "address": "1栋201",
    "isDefault": true
  }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 客户姓名 |
| phone | string | 是 | 手机号（唯一） |
| phoneSecondary | string | 否 | 备用手机号 |
| wechat | string | 否 | 微信号 |
| gender | string | 否 | 性别：MALE/FEMALE |
| birthday | string | 否 | 生日 |
| type | string | 否 | 客户类型：INDIVIDUAL/ENTERPRISE，默认 INDIVIDUAL |
| level | string | 否 | 客户等级：A/B/C/D，默认 D |
| notes | string | 否 | 备注 |
| tags | array | 否 | 标签数组 |
| address | object | 否 | 默认地址 |

### address 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | string | 否 | 地址标签 |
| province | string | 否 | 省份 |
| city | string | 否 | 城市 |
| district | string | 否 | 区县 |
| community | string | 否 | 小区 |
| address | string | 是 | 详细地址 |
| isDefault | boolean | 否 | 是否默认地址 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerNo": "C202601150001",
    "name": "张三",
    "phone": "13800138000",
    "phoneSecondary": "13900139000",
    "wechat": "wx123456",
    "gender": "MALE",
    "birthday": "1990-01-01",
    "type": "INDIVIDUAL",
    "level": "A",
    "lifecycleStage": "LEAD",
    "pipelineStatus": "UNASSIGNED",
    "loyaltyPoints": 0,
    "referralCode": "REF123456",
    "totalOrders": 0,
    "totalAmount": "0.00",
    "avgOrderAmount": "0.00",
    "notes": "VIP客户",
    "tags": ["VIP", "老客户"],
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

**错误响应** (409):

```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_DUPLICATE",
    "message": "手机号 13800138000 已存在 (客户编号: C202601140001)",
    "details": {
      "phone": "13800138000",
      "existingCustomerNo": "C202601140001"
    }
  }
}
```

### 业务规则

1. **客户查重**：系统会根据手机号自动查重，如果手机号已存在则返回错误
2. **客户编号**：系统自动生成，格式为 `C + YYYYMMDD + 4位随机十六进制`
3. **默认等级**：新客户默认等级为 D
4. **默认地址**：如果提供地址信息，会自动创建为默认地址

---

## 2. 查询客户列表

分页查询客户列表，支持多条件筛选和搜索。

### 接口信息
- **URL**: `GET /api/v1/customers`
- **认证**: 需要
- **权限**: `customers.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| search | string | 否 | 搜索关键词（姓名/手机号/客户编号） |
| type | string | 否 | 客户类型：INDIVIDUAL/ENTERPRISE |
| level | string | 否 | 客户等级：A/B/C/D |
| assignedSalesId | string | 否 | 分配的销售人员 ID |
| lifecycleStage | string | 否 | 生命周期阶段：LEAD/OPPORTUNITY/CUSTOMER/CHURNED |
| pipelineStatus | string | 否 | 销售阶段：UNASSIGNED/CONTACTED/QUALIFIED/PROPOSAL/NEGOTIATION/CLOSED_WON/CLOSED_LOST |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customerNo": "C202601150001",
      "name": "张三",
      "phone": "13800138000",
      "type": "INDIVIDUAL",
      "level": "A",
      "lifecycleStage": "CUSTOMER",
      "pipelineStatus": "CLOSED_WON",
      "loyaltyPoints": 1000,
      "totalOrders": 5,
      "totalAmount": "50000.00",
      "avgOrderAmount": "10000.00",
      "assignedSales": {
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

## 3. 查询客户详情

根据客户 ID 查询客户详细信息，包括地址、推荐关系等。

### 接口信息
- **URL**: `GET /api/v1/customers/{id}`
- **认证**: 需要
- **权限**: `customers.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 客户 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerNo": "C202601150001",
    "name": "张三",
    "phone": "13800138000",
    "phoneSecondary": "13900139000",
    "wechat": "wx123456",
    "gender": "MALE",
    "birthday": "1990-01-01",
    "type": "INDIVIDUAL",
    "level": "A",
    "lifecycleStage": "CUSTOMER",
    "pipelineStatus": "CLOSED_WON",
    "loyaltyPoints": 1000,
    "referralCode": "REF123456",
    "totalOrders": 5,
    "totalAmount": "50000.00",
    "avgOrderAmount": "10000.00",
    "firstOrderAt": "2025-01-15T10:00:00Z",
    "lastOrderAt": "2026-01-15T10:00:00Z",
    "notes": "VIP客户",
    "tags": ["VIP", "老客户"],
    "isActive": true,
    "assignedSales": {
      "id": "uuid",
      "name": "李四",
      "phone": "13800138001"
    },
    "creator": {
      "id": "uuid",
      "name": "王五"
    },
    "addresses": [
      {
        "id": "uuid",
        "label": "默认",
        "province": "广东省",
        "city": "深圳市",
        "district": "南山区",
        "community": "阳光小区",
        "address": "1栋201",
        "isDefault": true
      }
    ],
    "referrer": {
      "id": "uuid",
      "name": "赵六",
      "customerNo": "C202601010001"
    },
    "referrals": [
      {
        "id": "uuid",
        "name": "孙七",
        "customerNo": "C202601140001",
        "createdAt": "2026-01-14T10:00:00Z"
      }
    ],
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## 4. 更新客户信息

更新客户基本信息。

### 接口信息
- **URL**: `PUT /api/v1/customers/{id}`
- **认证**: 需要
- **权限**: `customers.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 客户 ID |

### 请求参数

```json
{
  "name": "张三",
  "phoneSecondary": "13900139000",
  "wechat": "wx123456",
  "gender": "MALE",
  "birthday": "1990-01-01",
  "level": "A",
  "notes": "VIP客户",
  "tags": ["VIP", "老客户"],
  "assignedSalesId": "uuid"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 客户姓名 |
| phoneSecondary | string | 否 | 备用手机号 |
| wechat | string | 否 | 微信号 |
| gender | string | 否 | 性别：MALE/FEMALE |
| birthday | string | 否 | 生日 |
| level | string | 否 | 客户等级：A/B/C/D |
| notes | string | 否 | 备注 |
| tags | array | 否 | 标签数组 |
| assignedSalesId | uuid | 否 | 分配的销售人员 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerNo": "C202601150001",
    "name": "张三",
    "phone": "13800138000",
    "phoneSecondary": "13900139000",
    "wechat": "wx123456",
    "gender": "MALE",
    "birthday": "1990-01-01",
    "level": "A",
    "notes": "VIP客户",
    "tags": ["VIP", "老客户"],
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 5. 删除客户

删除客户（软删除）。

### 接口信息
- **URL**: `DELETE /api/v1/customers/{id}`
- **认证**: 需要
- **权限**: `customers.delete`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 客户 ID |

### 响应示例

```json
{
  "success": true,
  "message": "客户删除成功"
}
```

### 业务规则

1. **软删除**：客户数据不会物理删除，而是标记为不活跃
2. **关联数据**：客户的订单、地址等关联数据会保留
3. **删除限制**：如果有未完成的订单，不允许删除

---

## 6. 添加客户地址

为客户添加新地址。

### 接口信息
- **URL**: `POST /api/v1/customers/{id}/addresses`
- **认证**: 需要
- **权限**: `customers.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 客户 ID |

### 请求参数

```json
{
  "label": "公司",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "community": "科技园",
  "address": "科技园南区 1 栋 101",
  "isDefault": false
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | string | 否 | 地址标签 |
| province | string | 否 | 省份 |
| city | string | 否 | 城市 |
| district | string | 否 | 区县 |
| community | string | 否 | 小区 |
| address | string | 是 | 详细地址 |
| isDefault | boolean | 否 | 是否默认地址 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "label": "公司",
    "province": "广东省",
    "city": "深圳市",
    "district": "南山区",
    "community": "科技园",
    "address": "科技园南区 1 栋 101",
    "isDefault": false,
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **默认地址**：如果设置为默认地址，会自动取消其他地址的默认状态
2. **地址数量**：不限制地址数量

---

## 7. 更新客户地址

更新客户地址信息。

### 接口信息
- **URL**: `PUT /api/v1/customers/addresses/{addressId}`
- **认证**: 需要
- **权限**: `customers.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| addressId | uuid | 是 | 地址 ID |

### 请求参数

```json
{
  "label": "公司",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "community": "科技园",
  "address": "科技园南区 1 栋 101",
  "isDefault": true
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "label": "公司",
    "province": "广东省",
    "city": "深圳市",
    "district": "南山区",
    "community": "科技园",
    "address": "科技园南区 1 栋 101",
    "isDefault": true,
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 8. 删除客户地址

删除客户地址。

### 接口信息
- **URL**: `DELETE /api/v1/customers/addresses/{addressId}`
- **认证**: 需要
- **权限**: `customers.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| addressId | uuid | 是 | 地址 ID |

### 响应示例

```json
{
  "success": true,
  "message": "地址删除成功"
}
```

### 业务规则

1. **默认地址**：不允许删除默认地址
2. **关联订单**：如果地址被订单引用，不允许删除

---

## 9. 设置默认地址

设置客户的默认地址。

### 接口信息
- **URL**: `PUT /api/v1/customers/{id}/addresses/{addressId}/default`
- **认证**: 需要
- **权限**: `customers.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 客户 ID |
| addressId | uuid | 是 | 地址 ID |

### 响应示例

```json
{
  "success": true,
  "message": "默认地址设置成功"
}
```

---

## 10. 合并客户

将重复的客户信息合并。

### 接口信息
- **URL**: `POST /api/v1/customers/merge`
- **认证**: 需要
- **权限**: `customers.merge`

### 请求参数

```json
{
  "sourceCustomerId": "uuid",
  "targetCustomerId": "uuid",
  "mergeStrategy": {
    "name": "TARGET",
    "phone": "TARGET",
    "wechat": "SOURCE",
    "addresses": "ALL",
    "orders": "TARGET",
    "leads": "ALL"
  }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sourceCustomerId | uuid | 是 | 源客户 ID（将被删除） |
| targetCustomerId | uuid | 是 | 目标客户 ID（保留） |
| mergeStrategy | object | 是 | 合并策略 |

### mergeStrategy 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 姓名：SOURCE/TARGET |
| phone | string | 是 | 手机号：SOURCE/TARGET |
| wechat | string | 是 | 微信号：SOURCE/TARGET |
| addresses | string | 是 | 地址：SOURCE/TARGET/ALL |
| orders | string | 是 | 订单：SOURCE/TARGET/ALL |
| leads | string | 是 | 线索：SOURCE/TARGET/ALL |

### 响应示例

```json
{
  "success": true,
  "data": {
    "mergedCustomerId": "uuid",
    "mergedCustomerNo": "C202601150001",
    "mergedFields": ["addresses", "orders", "leads"],
    "deletedCustomerId": "uuid",
    "deletedCustomerNo": "C202601140001"
  }
}
```

### 业务规则

1. **合并限制**：不能合并同一个客户
2. **数据保留**：源客户的数据会转移到目标客户
3. **源客户删除**：合并后源客户会被标记为不活跃

---

## 11. 更新客户等级

批量或单个更新客户等级。

### 接口信息
- **URL**: `PUT /api/v1/customers/level`
- **认证**: 需要
- **权限**: `customers.update`

### 请求参数

```json
{
  "customerIds": ["uuid", "uuid"],
  "level": "A",
  "reason": "年度消费超过 10 万"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| customerIds | array | 是 | 客户 ID 数组 |
| level | string | 是 | 客户等级：A/B/C/D |
| reason | string | 否 | 调整原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "updatedCount": 2,
    "customerNos": ["C202601150001", "C202601150002"]
  }
}
```

---

## 12. 客户统计

获取客户统计数据。

### 接口信息
- **URL**: `GET /api/v1/customers/statistics`
- **认证**: 需要
- **权限**: `customers.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| level | string | 否 | 客户等级：A/B/C/D |

### 响应示例

```json
{
  "success": true,
  "data": {
    "totalCustomers": 1000,
    "newCustomers": 50,
    "activeCustomers": 800,
    "churnedCustomers": 20,
    "levelDistribution": {
      "A": 100,
      "B": 200,
      "C": 300,
      "D": 400
    },
    "lifecycleDistribution": {
      "LEAD": 300,
      "OPPORTUNITY": 200,
      "CUSTOMER": 450,
      "CHURNED": 50
    },
    "totalAmount": "1000000.00",
    "avgOrderAmount": "1000.00"
  }
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| CUSTOMER_NOT_FOUND | 404 | 客户不存在 |
| CUSTOMER_ALREADY_EXISTS | 409 | 客户已存在 |
| CUSTOMER_DUPLICATE | 409 | 客户重复（手机号已存在） |
| CUSTOMER_CANNOT_DELETE | 422 | 客户不能删除 |
| CUSTOMER_CANNOT_MERGE | 422 | 客户不能合并 |
| CUSTOMER_ALREADY_MERGED | 409 | 客户已合并 |
| CUSTOMER_INVALID_LEVEL | 400 | 客户等级无效 |
| CUSTOMER_INVALID_STAGE | 400 | 客户阶段无效 |
| CUSTOMER_INVALID_TYPE | 400 | 客户类型无效 |
| CUSTOMER_ADDRESS_NOT_FOUND | 404 | 客户地址不存在 |
| CUSTOMER_ADDRESS_INVALID | 400 | 客户地址无效 |

---

## 数据模型

### Customer

```typescript
interface Customer {
  id: string;
  tenantId: string;
  customerNo: string;
  name: string;
  type: 'INDIVIDUAL' | 'ENTERPRISE';
  phone: string;
  phoneSecondary?: string;
  wechat?: string;
  gender?: 'MALE' | 'FEMALE';
  birthday?: Date;
  level: 'A' | 'B' | 'C' | 'D';
  lifecycleStage: 'LEAD' | 'OPPORTUNITY' | 'CUSTOMER' | 'CHURNED';
  pipelineStatus: 'UNASSIGNED' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  referrerCustomerId?: string;
  sourceLeadId?: string;
  loyaltyPoints: number;
  referralCode?: string;
  totalOrders: number;
  totalAmount: string;
  avgOrderAmount: string;
  firstOrderAt?: Date;
  lastOrderAt?: Date;
  notes?: string;
  tags?: string[];
  assignedSalesId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### CustomerAddress

```typescript
interface CustomerAddress {
  id: string;
  tenantId: string;
  customerId: string;
  label?: string;
  province?: string;
  city?: string;
  district?: string;
  community?: string;
  address: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
