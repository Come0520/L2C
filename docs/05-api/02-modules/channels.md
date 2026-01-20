# 渠道模块 API

> 渠道模块提供渠道管理、渠道联系人管理、渠道佣金管理、渠道结算管理等功能，支持渠道全生命周期管理。

## 概述

渠道模块是 L2C 系统的核心模块之一，负责管理所有渠道信息。系统支持渠道管理、渠道联系人管理、渠道佣金管理、渠道结算管理、渠道等级管理等功能。

### 核心功能

- 渠道管理（创建、查询、更新、删除）
- 渠道联系人管理
- 渠道佣金管理
- 渠道结算管理
- 渠道等级管理
- 渠道统计

---

## 1. 创建渠道

创建新渠道。

### 接口信息
- **URL**: `POST /api/v1/channels`
- **认证**: 需要
- **权限**: `channels.create`

### 请求参数

```json
{
  "channelType": "DEALER",
  "name": "深圳代理商",
  "code": "QD202601150001",
  "level": "A",
  "contactName": "李四",
  "phone": "13800138001",
  "commissionRate": 10,
  "commissionType": "FIXED",
  "tieredRates": [
    {
      "min": 0,
      "rate": 10
    }
  ],
  "cooperationMode": "BASE_PRICE",
  "priceDiscountRate": 0.95,
  "settlementType": "MONTHLY",
  "bankInfo": {
    "bankName": "工商银行",
    "accountNumber": "6222021234567890",
    "accountHolder": "李四"
  },
  "contractFiles": [
    "https://oss.example.com/contract1.pdf"
  ],
  "assignedManagerId": "uuid"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| channelType | string | 是 | 渠道类型：DEALER/DISTRIBUTOR/AGENT/ONLINE_PLATFORM |
| name | string | 是 | 渠道名称 |
| code | string | 是 | 渠道代码（唯一） |
| level | string | 是 | 渠道等级：A/B/C/D |
| contactName | string | 是 | 联系人姓名 |
| phone | string | 是 | 联系电话 |
| commissionRate | number | 是 | 佣金率（%） |
| commissionType | string | 否 | 佣金类型：FIXED/TIERED，默认 FIXED |
| tieredRates | array | 否 | 阶梯佣金率 |
| cooperationMode | string | 是 | 合作模式：BASE_PRICE/COMMISSION |
| priceDiscountRate | number | 否 | 价格折扣率（0-1） |
| settlementType | string | 是 | 结算类型：PREPAY/MONTHLY |
| bankInfo | object | 否 | 银行信息 |
| contractFiles | array | 否 | 合同文件 URL 数组 |
| assignedManagerId | string | 否 | 分配的管理员 ID |

### tieredRates 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| min | number | 是 | 最小金额 |
| rate | number | 是 | 佣金率（%） |

### bankInfo 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bankName | string | 是 | 银行名称 |
| accountNumber | string | 是 | 账号 |
| accountHolder | string | 是 | 账户持有人 |
| branchName | string | 否 | 开户支行 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "channelType": "DEALER",
    "name": "深圳代理商",
    "code": "QD202601150001",
    "level": "A",
    "contactName": "李四",
    "phone": "13800138001",
    "commissionRate": "10.00",
    "commissionType": "FIXED",
    "tieredRates": [
      {
        "min": 0,
        "rate": 10
      }
    ],
    "cooperationMode": "BASE_PRICE",
    "priceDiscountRate": "0.9500",
    "settlementType": "MONTHLY",
    "bankInfo": {
      "bankName": "工商银行",
      "accountNumber": "6222021234567890",
      "accountHolder": "李四"
    },
    "contractFiles": [
      "https://oss.example.com/contract1.pdf"
    ],
    "totalLeads": 0,
    "totalDealAmount": "0",
    "status": "ACTIVE",
    "assignedManagerId": "uuid",
    "createdBy": "uuid",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **渠道代码**：渠道代码在租户内必须唯一
2. **初始状态**：新渠道默认为活跃状态
3. **初始统计**：新渠道的线索数和成交金额为 0
4. **自动创建联系人**：创建渠道时自动创建第一个联系人

---

## 2. 查询渠道列表

分页查询渠道列表，支持多条件筛选和搜索。

### 接口信息
- **URL**: `GET /api/v1/channels`
- **认证**: 需要
- **权限**: `channels.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| search | string | 否 | 搜索关键词（名称/代码/电话） |
| type | string | 否 | 渠道类型 |
| level | string | 否 | 渠道等级：A/B/C/D |
| status | string | 否 | 渠道状态：ACTIVE/SUSPENDED/TERMINATED |
| assignedManagerId | string | 否 | 分配的管理员 ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "channelType": "DEALER",
      "name": "深圳代理商",
      "code": "QD202601150001",
      "level": "A",
      "contactName": "李四",
      "phone": "13800138001",
      "commissionRate": "10.00",
      "cooperationMode": "BASE_PRICE",
      "priceDiscountRate": "0.9500",
      "settlementType": "MONTHLY",
      "totalLeads": 50,
      "totalDealAmount": "500000.00",
      "status": "ACTIVE",
      "assignedManagerId": "uuid",
      "assignedManager": {
        "id": "uuid",
        "name": "王五"
      },
      "contacts": [
        {
          "id": "uuid",
          "name": "李四",
          "phone": "13800138001",
          "isMain": true
        }
      ],
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

## 3. 查询渠道详情

根据渠道 ID 查询渠道详细信息。

### 接口信息
- **URL**: `GET /api/v1/channels/{id}`
- **认证**: 需要
- **权限**: `channels.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "channelType": "DEALER",
    "name": "深圳代理商",
    "code": "QD202601150001",
    "level": "A",
    "contactName": "李四",
    "phone": "13800138001",
    "commissionRate": "10.00",
    "commissionType": "FIXED",
    "tieredRates": [
      {
        "min": 0,
        "rate": 10
      }
    ],
    "cooperationMode": "BASE_PRICE",
    "priceDiscountRate": "0.9500",
    "settlementType": "MONTHLY",
    "bankInfo": {
      "bankName": "工商银行",
      "accountNumber": "6222021234567890",
      "accountHolder": "李四",
      "branchName": "南山支行"
    },
    "contractFiles": [
      "https://oss.example.com/contract1.pdf"
    ],
    "totalLeads": 50,
    "totalDealAmount": "500000.00",
    "status": "ACTIVE",
    "assignedManagerId": "uuid",
    "assignedManager": {
      "id": "uuid",
      "name": "王五",
      "phone": "13800138002"
    },
    "createdBy": "uuid",
    "creator": {
      "id": "uuid",
      "name": "赵六"
    },
    "contacts": [
      {
        "id": "uuid",
        "channelId": "uuid",
        "name": "李四",
        "phone": "13800138001",
        "wechat": "wx123456",
        "email": "lisi@example.com",
        "isMain": true,
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## 4. 更新渠道

更新渠道信息。

### 接口信息
- **URL**: `PUT /api/v1/channels/{id}`
- **认证**: 需要
- **权限**: `channels.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 请求参数

```json
{
  "name": "深圳代理商（更名）",
  "contactName": "李四",
  "phone": "13800138001",
  "commissionRate": 12,
  "cooperationMode": "COMMISSION",
  "priceDiscountRate": 0.9,
  "settlementType": "MONTHLY",
  "bankInfo": {
    "bankName": "建设银行",
    "accountNumber": "6227001234567890",
    "accountHolder": "李四"
  },
  "assignedManagerId": "uuid"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 渠道名称 |
| contactName | string | 否 | 联系人姓名 |
| phone | string | 否 | 联系电话 |
| commissionRate | number | 否 | 佣金率（%） |
| commissionType | string | 否 | 佣金类型：FIXED/TIERED |
| tieredRates | array | 否 | 阶梯佣金率 |
| cooperationMode | string | 否 | 合作模式：BASE_PRICE/COMMISSION |
| priceDiscountRate | number | 否 | 价格折扣率（0-1） |
| settlementType | string | 否 | 结算类型：PREPAY/MONTHLY |
| bankInfo | object | 否 | 银行信息 |
| assignedManagerId | string | 否 | 分配的管理员 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "QD202601150001",
    "name": "深圳代理商（更名）",
    "contactName": "李四",
    "phone": "13800138001",
    "commissionRate": "12.00",
    "cooperationMode": "COMMISSION",
    "priceDiscountRate": "0.9000",
    "settlementType": "MONTHLY",
    "bankInfo": {
      "bankName": "建设银行",
      "accountNumber": "6227001234567890",
      "accountHolder": "李四"
    },
    "assignedManagerId": "uuid",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **代码修改**：修改渠道代码时需要验证唯一性
2. **佣金验证**：修改佣金率时验证合理性

---

## 5. 删除渠道

删除渠道。

### 接口信息
- **URL**: `DELETE /api/v1/channels/{id}`
- **认证**: 需要
- **权限**: `channels.delete`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 响应示例

```json
{
  "success": true,
  "message": "渠道删除成功"
}
```

### 业务规则

1. **关联线索**：如果渠道有关联的线索，不允许删除
2. **关联订单**：如果渠道有关联的订单，不允许删除
3. **未结算佣金**：如果有未结算的佣金，不允许删除

---

## 6. 添加渠道联系人

为渠道添加联系人。

### 接口信息
- **URL**: `POST /api/v1/channels/{id}/contacts`
- **认证**: 需要
- **权限**: `channels.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 请求参数

```json
{
  "name": "王五",
  "phone": "13800138002",
  "wechat": "wx789012",
  "email": "wangwu@example.com",
  "isMain": false
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 联系人姓名 |
| phone | string | 是 | 联系电话 |
| wechat | string | 否 | 微信号 |
| email | string | 否 | 邮箱 |
| isMain | boolean | 否 | 是否主要联系人 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "channelId": "uuid",
    "name": "王五",
    "phone": "13800138002",
    "wechat": "wx789012",
    "email": "wangwu@example.com",
    "isMain": false,
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **主要联系人**：一个渠道只能有一个主要联系人
2. **自动设置**：如果是第一个联系人，自动设置为主要联系人

---

## 7. 更新渠道联系人

更新渠道联系人信息。

### 接口信息
- **URL**: `PUT /api/v1/channels/contacts/{contactId}`
- **认证**: 需要
- **权限**: `channels.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| contactId | uuid | 是 | 联系人 ID |

### 请求参数

```json
{
  "name": "王五",
  "phone": "13800138002",
  "wechat": "wx789012",
  "email": "wangwu@example.com",
  "isMain": true
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "王五",
    "phone": "13800138002",
    "wechat": "wx789012",
    "email": "wangwu@example.com",
    "isMain": true,
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## 8. 删除渠道联系人

删除渠道联系人。

### 接口信息
- **URL**: `DELETE /api/v1/channels/contacts/{contactId}`
- **认证**: 需要
- **权限**: `channels.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| contactId | uuid | 是 | 联系人 ID |

### 响应示例

```json
{
  "success": true,
  "message": "联系人删除成功"
}
```

### 业务规则

1. **主要联系人**：不允许删除主要联系人

---

## 9. 设置主要联系人

设置渠道的主要联系人。

### 接口信息
- **URL**: `PUT /api/v1/channels/{id}/contacts/{contactId}/main`
- **认证**: 需要
- **权限**: `channels.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |
| contactId | uuid | 是 | 联系人 ID |

### 响应示例

```json
{
  "success": true,
  "message": "主要联系人设置成功"
}
```

### 业务规则

1. **唯一性**：一个渠道只能有一个主要联系人
2. **自动取消**：设置新的主要联系人时，自动取消其他联系人的主要状态

---

## 10. 暂停渠道

暂停渠道。

### 接口信息
- **URL**: `POST /api/v1/channels/{id}/suspend`
- **认证**: 需要
- **权限**: `channels.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 请求参数

```json
{
  "reason": "合作暂停"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 暂停原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "QD202601150001",
    "status": "SUSPENDED",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 ACTIVE 状态的渠道可以暂停
2. **禁止创建线索**：暂停后不能创建新的线索

---

## 11. 恢复渠道

恢复暂停的渠道。

### 接口信息
- **URL**: `POST /api/v1/channels/{id}/activate`
- **认证**: 需要
- **权限**: `channels.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 请求参数

```json
{
  "reason": "合作恢复"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 恢复原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "QD202601150001",
    "status": "ACTIVE",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 SUSPENDED 状态的渠道可以恢复

---

## 12. 终止渠道

终止渠道合作。

### 接口信息
- **URL**: `POST /api/v1/channels/{id}/terminate`
- **认证**: 需要
- **权限**: `channels.delete`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 请求参数

```json
{
  "reason": "合作终止"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 终止原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "QD202601150001",
    "status": "TERMINATED",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 ACTIVE 或 SUSPENDED 状态的渠道可以终止
2. **禁止创建线索**：终止后不能创建新的线索
3. **结算处理**：终止后需要结算所有未结算佣金

---

## 13. 更新渠道等级

更新渠道等级。

### 接口信息
- **URL**: `PUT /api/v1/channels/{id}/level`
- **认证**: 需要
- **权限**: `channels.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 请求参数

```json
{
  "level": "A",
  "reason": "业绩优秀"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | string | 是 | 渠道等级：A/B/C/D |
| reason | string | 否 | 调整原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "QD202601150001",
    "level": "A",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **等级调整**：记录等级调整历史
2. **佣金影响**：等级调整可能影响佣金率

---

## 14. 渠道统计

获取渠道统计数据。

### 接口信息
- **URL**: `GET /api/v1/channels/{id}/statistics`
- **认证**: 需要
- **权限**: `channels.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

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
    "channelId": "uuid",
    "channelCode": "QD202601150001",
    "channelName": "深圳代理商",
    "totalLeads": 50,
    "totalDeals": 30,
    "totalDealAmount": "500000.00",
    "totalCommission": "50000.00",
    "conversionRate": 0.6,
    "avgDealAmount": "16666.67",
    "monthlyStats": [
      {
        "month": "2026-01",
        "leads": 50,
        "deals": 30,
        "dealAmount": "500000.00",
        "commission": "50000.00"
      }
    ]
  }
}
```

---

## 15. 渠道佣金结算

结算渠道佣金。

### 接口信息
- **URL**: `POST /api/v1/channels/{id}/settlement`
- **认证**: 需要
- **权限**: `channels.settlement`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 请求参数

```json
{
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "commissionAmount": 50000,
  "paymentMethod": "BANK_TRANSFER",
  "paymentProof": "https://oss.example.com/payment1.jpg",
  "remark": "1月份佣金结算"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 结算开始日期 |
| endDate | string | 是 | 结算结束日期 |
| commissionAmount | number | 是 | 佣金金额 |
| paymentMethod | string | 是 | 支付方式：BANK_TRANSFER/CASH/ALIPAY/WECHAT |
| paymentProof | string | 否 | 支付凭证 URL |
| remark | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "channelId": "uuid",
    "channelCode": "QD202601150001",
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "commissionAmount": "50000.00",
    "paymentMethod": "BANK_TRANSFER",
    "paymentProof": "https://oss.example.com/payment1.jpg",
    "status": "PAID",
    "remark": "1月份佣金结算",
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **结算周期**：根据结算类型确定结算周期
2. **佣金计算**：系统自动计算应结算佣金
3. **支付凭证**：需要上传支付凭证

---

## 16. 查询佣金结算记录

查询渠道佣金结算记录。

### 接口信息
- **URL**: `GET /api/v1/channels/{id}/settlements`
- **认证**: 需要
- **权限**: `channels.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| status | string | 否 | 结算状态 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "channelId": "uuid",
      "channelCode": "QD202601150001",
      "startDate": "2026-01-01",
      "endDate": "2026-01-31",
      "commissionAmount": "50000.00",
      "paymentMethod": "BANK_TRANSFER",
      "paymentProof": "https://oss.example.com/payment1.jpg",
      "status": "PAID",
      "remark": "1月份佣金结算",
      "createdAt": "2026-01-15T11:00:00Z"
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

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| CHANNEL_NOT_FOUND | 404 | 渠道不存在 |
| CHANNEL_ALREADY_EXISTS | 409 | 渠道已存在 |
| CHANNEL_CANNOT_DELETE | 422 | 渠道不能删除 |
| CHANNEL_INVALID_TYPE | 400 | 渠道类型无效 |
| CHANNEL_INVALID_LEVEL | 400 | 渠道等级无效 |
| CHANNEL_INVALID_COMMISSION_TYPE | 400 | 佣金类型无效 |
| CHANNEL_INVALID_COOPERATION_MODE | 400 | 合作模式无效 |
| CHANNEL_INVALID_SETTLEMENT_TYPE | 400 | 结算类型无效 |
| CHANNEL_CONTACT_NOT_FOUND | 404 | 渠道联系人不存在 |
| CHANNEL_CONTACT_INVALID | 400 | 渠道联系人无效 |

---

## 数据模型

### Channel

```typescript
interface Channel {
  id: string;
  tenantId: string;
  channelType: 'DEALER' | 'DISTRIBUTOR' | 'AGENT' | 'ONLINE_PLATFORM';
  name: string;
  code: string;
  level: 'A' | 'B' | 'C' | 'D';
  contactName: string;
  phone: string;
  commissionRate: string;
  commissionType?: 'FIXED' | 'TIERED';
  tieredRates?: Array<{
    min: number;
    rate: number;
  }>;
  cooperationMode: 'BASE_PRICE' | 'COMMISSION';
  priceDiscountRate?: string;
  settlementType: 'PREPAY' | 'MONTHLY';
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branchName?: string;
  };
  contractFiles?: string[];
  totalLeads: number;
  totalDealAmount: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  assignedManagerId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ChannelContact

```typescript
interface ChannelContact {
  id: string;
  tenantId: string;
  channelId: string;
  name: string;
  phone: string;
  wechat?: string;
  email?: string;
  isMain: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ChannelSettlement

```typescript
interface ChannelSettlement {
  id: string;
  tenantId: string;
  channelId: string;
  channelCode: string;
  startDate: Date;
  endDate: Date;
  commissionAmount: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'ALIPAY' | 'WECHAT';
  paymentProof?: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
