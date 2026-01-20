# 线索模块 API

> 线索管理、智能查重、自动分配

## 模块概述

线索模块负责管理销售线索，包括线索创建、智能查重、自动分配、跟进记录等功能。

### 核心功能

- 智能查重（手机号、地址）
- 自动分配销售人员
- 线索状态流转
- 跟进记录管理
- 免费测量申请
- 预约测量

### 数据模型

#### Lead（线索）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |
| leadNo | string | 是 | 线索编号 |
| tenantId | uuid | 是 | 租户 ID |
| customerName | string | 是 | 客户姓名 |
| customerPhone | string | 是 | 客户手机号 |
| customerWechat | string | 否 | 客户微信 |
| address | string | 否 | 客户地址 |
| community | string | 否 | 小区名称 |
| houseType | string | 否 | 房屋类型 |
| status | string | 是 | 状态 |
| intentionLevel | string | 否 | 意向等级 |
| channelId | uuid | 否 | 渠道 ID |
| channelContactId | uuid | 否 | 渠道联系人 ID |
| sourceChannelId | uuid | 否 | 来源渠道 ID |
| distributionRuleId | uuid | 否 | 分配规则 ID |
| estimatedAmount | decimal | 否 | 预估金额 |
| tags | string[] | 否 | 标签 |
| notes | text | 否 | 备注 |
| lostReason | text | 否 | 流失原因 |
| assignedSalesId | uuid | 否 | 分配的销售 ID |
| assignedAt | timestamp | 否 | 分配时间 |
| lastActivityAt | timestamp | 否 | 最后活动时间 |
| nextFollowupAt | timestamp | 否 | 下次跟进时间 |
| decorationProgress | string | 否 | 装修进度 |
| quotedAt | timestamp | 否 | 报价时间 |
| visitedStoreAt | timestamp | 否 | 到店时间 |
| wonAt | timestamp | 否 | 成交时间 |
| customerId | uuid | 否 | 关联客户 ID |
| createdBy | uuid | 是 | 创建人 ID |
| createdAt | timestamp | 是 | 创建时间 |
| updatedAt | timestamp | 是 | 更新时间 |

#### LeadActivity（跟进记录）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 记录 ID |
| tenantId | uuid | 是 | 租户 ID |
| leadId | uuid | 是 | 线索 ID |
| quoteId | uuid | 否 | 报价单 ID |
| purchaseIntention | string | 否 | 购买意向 |
| customerLevel | string | 否 | 客户等级 |
| activityType | string | 是 | 活动类型 |
| content | text | 是 | 活动内容 |
| location | string | 否 | 活动地点 |
| nextFollowupDate | timestamp | 否 | 下次跟进日期 |
| createdBy | uuid | 是 | 创建人 ID |
| createdAt | timestamp | 是 | 创建时间 |

## API 接口

### 1. 创建线索（智能创建）

创建线索并执行智能查重与自动分配。

#### 接口信息

- **URL**: `POST /api/v1/leads`
- **认证**: 需要
- **权限**: `leads.create`

#### 请求参数

```json
{
  "customerPhone": "13800138000",
  "customerName": "张三",
  "customerWechat": "wx123456",
  "address": "1栋201",
  "community": "阳光小区",
  "houseType": "三室两厅",
  "channelId": "uuid",
  "channelContactId": "uuid",
  "sourceChannelId": "uuid",
  "intentionLevel": "HIGH",
  "decorationProgress": "WATER_ELECTRIC",
  "estimatedAmount": "50000.00",
  "tags": ["VIP", "大户型"],
  "notes": "客户意向高"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| customerPhone | string | 是 | 客户手机号，第一查重键 |
| customerName | string | 是 | 客户姓名 |
| customerWechat | string | 否 | 客户微信 |
| address | string | 否 | 客户地址，第二查重键 |
| community | string | 否 | 小区名称，第二查重键 |
| houseType | string | 否 | 房屋类型 |
| channelId | string | 否 | 渠道 ID |
| channelContactId | string | 否 | 渠道联系人 ID |
| sourceChannelId | string | 否 | 来源渠道 ID |
| intentionLevel | string | 否 | 意向等级：HIGH/MEDIUM/LOW |
| decorationProgress | string | 否 | 装修进度：WATER_ELECTRIC/MUD_WOOD/INSTALLATION/PAINTING/COMPLETED |
| estimatedAmount | string | 否 | 预估金额 |
| tags | string[] | 否 | 标签 |
| notes | text | 否 | 备注 |

#### 响应示例

**成功响应（非重复）**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "leadNo": "LD20260115ABC123",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "status": "PENDING_ASSIGNMENT",
    "isDuplicate": false,
    "assignedSalesId": "uuid",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

**成功响应（重复）**:

```json
{
  "success": true,
  "data": {
    "isDuplicate": true,
    "duplicateReason": "PHONE",
    "existingLead": {
      "id": "uuid",
      "leadNo": "LD20260110DEF456",
      "customerName": "张三",
      "customerPhone": "13800138000",
      "status": "FOLLOWING_UP",
      "assignedSalesId": "uuid"
    }
  }
}
```

#### 业务规则

1. **查重规则**：
   - 第一查重键：客户手机号
   - 第二查重键：小区名称 + 地址
   - 查重范围：当前租户内

2. **自动分配**：
   - 根据渠道分配规则自动分配销售人员
   - 如果没有分配规则，分配到公海池

3. **自动关联客户**：
   - 如果手机号已存在客户，自动关联客户

### 2. 查询线索列表

查询线索列表，支持分页、排序、过滤。

#### 接口信息

- **URL**: `GET /api/v1/leads`
- **认证**: 需要
- **权限**: `leads.read`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| sortBy | string | 否 | 排序字段，默认 createdAt |
| sortOrder | string | 否 | 排序方向，默认 desc |
| status | string | 否 | 状态过滤 |
| intentionLevel | string | 否 | 意向等级过滤 |
| assignedSalesId | string | 否 | 分配的销售 ID |
| channelId | string | 否 | 渠道 ID |
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
        "leadNo": "LD20260115ABC123",
        "customerName": "张三",
        "customerPhone": "13800138000",
        "status": "FOLLOWING_UP",
        "intentionLevel": "HIGH",
        "community": "阳光小区",
        "address": "1栋201",
        "assignedSalesId": "uuid",
        "assignedSalesName": "李四",
        "lastActivityAt": "2026-01-15T10:00:00Z",
        "nextFollowupAt": "2026-01-16T10:00:00Z",
        "createdAt": "2026-01-15T09:00:00Z"
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

### 3. 查询线索详情

查询单个线索的详细信息。

#### 接口信息

- **URL**: `GET /api/v1/leads/{id}`
- **认证**: 需要
- **权限**: `leads.read`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "leadNo": "LD20260115ABC123",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "customerWechat": "wx123456",
    "address": "1栋201",
    "community": "阳光小区",
    "houseType": "三室两厅",
    "status": "FOLLOWING_UP",
    "intentionLevel": "HIGH",
    "channelId": "uuid",
    "channelName": "装修公司A",
    "estimatedAmount": "50000.00",
    "tags": ["VIP", "大户型"],
    "notes": "客户意向高",
    "assignedSalesId": "uuid",
    "assignedSalesName": "李四",
    "assignedAt": "2026-01-15T09:30:00Z",
    "lastActivityAt": "2026-01-15T10:00:00Z",
    "nextFollowupAt": "2026-01-16T10:00:00Z",
    "decorationProgress": "WATER_ELECTRIC",
    "customerId": "uuid",
    "customerName": "张三",
    "createdBy": "uuid",
    "createdByName": "王五",
    "createdAt": "2026-01-15T09:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z",
    "activities": [
      {
        "id": "uuid",
        "activityType": "PHONE_CALL",
        "content": "电话跟进，客户意向高",
        "createdBy": "uuid",
        "createdByName": "李四",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

### 4. 更新线索

更新线索信息。

#### 接口信息

- **URL**: `PATCH /api/v1/leads/{id}`
- **认证**: 需要
- **权限**: `leads.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |

#### 请求参数

```json
{
  "customerName": "张三",
  "intentionLevel": "HIGH",
  "estimatedAmount": "60000.00",
  "tags": ["VIP", "大户型", "重点跟进"],
  "notes": "客户意向高，预计本周到店"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "leadNo": "LD20260115ABC123",
    "customerName": "张三",
    "intentionLevel": "HIGH",
    "estimatedAmount": "60000.00",
    "tags": ["VIP", "大户型", "重点跟进"],
    "notes": "客户意向高，预计本周到店",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 5. 分配线索

将线索分配给销售人员。

#### 接口信息

- **URL**: `POST /api/v1/leads/{id}/assign`
- **认证**: 需要
- **权限**: `leads.assign`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |

#### 请求参数

```json
{
  "assignedSalesId": "uuid",
  "reason": "客户要求更换销售"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "leadNo": "LD20260115ABC123",
    "assignedSalesId": "uuid",
    "assignedSalesName": "赵六",
    "assignedAt": "2026-01-15T11:00:00Z",
    "status": "FOLLOWING_UP"
  }
}
```

### 6. 批量分配线索

批量分配线索给销售人员。

#### 接口信息

- **URL**: `POST /api/v1/leads/batch-assign`
- **认证**: 需要
- **权限**: `leads.assign`

#### 请求参数

```json
{
  "leadIds": ["uuid1", "uuid2", "uuid3"],
  "assignedSalesId": "uuid",
  "reason": "重新分配"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "successCount": 3,
    "failedCount": 0,
    "results": [
      {
        "leadId": "uuid1",
        "success": true
      },
      {
        "leadId": "uuid2",
        "success": true
      },
      {
        "leadId": "uuid3",
        "success": true
      }
    ]
  }
}
```

### 7. 添加跟进记录

为线索添加跟进记录。

#### 接口信息

- **URL**: `POST /api/v1/leads/{id}/activities`
- **认证**: 需要
- **权限**: `leads.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |

#### 请求参数

```json
{
  "activityType": "PHONE_CALL",
  "content": "电话跟进，客户意向高，预计本周到店",
  "purchaseIntention": "HIGH",
  "customerLevel": "A",
  "location": "公司",
  "nextFollowupDate": "2026-01-16T10:00:00Z"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| activityType | string | 是 | 活动类型：PHONE_CALL/WECHAT_CHAT/STORE_VISIT/HOME_VISIT/QUOTE_SENT/SYSTEM |
| content | text | 是 | 活动内容 |
| purchaseIntention | string | 否 | 购买意向：HIGH/MEDIUM/LOW |
| customerLevel | string | 否 | 客户等级：A/B/C/D |
| location | string | 否 | 活动地点 |
| nextFollowupDate | timestamp | 否 | 下次跟进日期 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "leadId": "uuid",
    "activityType": "PHONE_CALL",
    "content": "电话跟进，客户意向高，预计本周到店",
    "purchaseIntention": "HIGH",
    "customerLevel": "A",
    "location": "公司",
    "nextFollowupDate": "2026-01-16T10:00:00Z",
    "createdBy": "uuid",
    "createdByName": "李四",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### 8. 申请免费测量

申请免费测量服务。

#### 接口信息

- **URL**: `POST /api/v1/leads/{id}/apply-free-measure`
- **认证**: 需要
- **权限**: `leads.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |

#### 请求参数

```json
{
  "reason": "客户意向高，且为大户型",
  "intentionLevel": "HIGH"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "leadNo": "LD20260115ABC123",
    "status": "PENDING_MEASURE",
    "freeMeasureApplied": true,
    "appliedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 9. 预约测量

发起测量任务，支持多种场景。

#### 接口信息

- **URL**: `POST /api/v1/leads/{id}/dispatch-measure`
- **认证**: 需要
- **权限**: `leads.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |

#### 请求参数

```json
{
  "type": "QUOTE_BASED",
  "quoteId": "uuid",
  "scheduledAt": "2026-02-01T10:00:00Z",
  "assignedWorkerId": "uuid",
  "remark": "客户要求上午测量"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 测量类型：QUOTE_BASED/BLIND/SALES_SELF |
| quoteId | string | 否 | 报价单 ID（type=QUOTE_BASED 时必填） |
| scheduledAt | timestamp | 是 | 预约时间 |
| assignedWorkerId | string | 否 | 指定测量师 ID |
| remark | text | 否 | 备注 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS20260115ABC123",
    "leadId": "uuid",
    "customerId": "uuid",
    "type": "QUOTE_BASED",
    "status": "PENDING",
    "scheduledAt": "2026-02-01T10:00:00Z",
    "assignedWorkerId": "uuid",
    "assignedWorkerName": "测量师A",
    "createdAt": "2026-01-15T11:00:00Z"
  }
}
```

### 10. 转为客户

将线索转为正式客户。

#### 接口信息

- **URL**: `POST /api/v1/leads/{id}/convert-to-customer`
- **认证**: 需要
- **权限**: `leads.update`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |

#### 请求参数

```json
{
  "customerLevel": "A",
  "tags": ["VIP"],
  "notes": "重点客户"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "customerId": "uuid",
    "customerNo": "CUST20260115ABC123",
    "leadId": "uuid",
    "leadNo": "LD20260115ABC123",
    "status": "WON",
    "wonAt": "2026-01-15T11:00:00Z"
  }
}
```

### 11. 删除线索

删除线索（软删除）。

#### 接口信息

- **URL**: `DELETE /api/v1/leads/{id}`
- **认证**: 需要
- **权限**: `leads.delete`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "deletedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 12. 线索统计

获取线索统计数据。

#### 接口信息

- **URL**: `GET /api/v1/leads/statistics`
- **认证**: 需要
- **权限**: `leads.read`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期（ISO 8601） |
| endDate | string | 否 | 结束日期（ISO 8601） |
| groupBy | string | 否 | 分组字段：status/intentionLevel/channel |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "total": 100,
    "byStatus": {
      "PENDING_ASSIGNMENT": 10,
      "FOLLOWING_UP": 50,
      "WON": 30,
      "INVALID": 10
    },
    "byIntentionLevel": {
      "HIGH": 30,
      "MEDIUM": 50,
      "LOW": 20
    },
    "byChannel": [
      {
        "channelId": "uuid",
        "channelName": "装修公司A",
        "count": 30
      },
      {
        "channelId": "uuid",
        "channelName": "设计师B",
        "count": 20
      }
    ]
  }
}
```

## 状态流转

### 线索状态

| 状态 | 说明 | 可转换状态 |
|------|------|-----------|
| PENDING_ASSIGNMENT | 待分配 | FOLLOWING_UP, INVALID |
| FOLLOWING_UP | 跟踪中 | WON, INVALID |
| WON | 已成交 | - |
| INVALID | 无效 | - |

### 状态转换规则

1. **PENDING_ASSIGNMENT → FOLLOWING_UP**
   - 分配销售人员后自动转换

2. **FOLLOWING_UP → WON**
   - 转为客户后自动转换

3. **PENDING_ASSIGNMENT/FOLLOWING_UP → INVALID**
   - 标记为无效线索

## 业务规则

### 查重规则

1. **手机号查重**：
   - 同一租户内，手机号唯一
   - 创建时检查手机号是否已存在

2. **地址查重**：
   - 同一租户内，小区名称 + 地址组合唯一
   - 作为第二查重键

### 分配规则

1. **自动分配**：
   - 根据渠道分配规则自动分配
   - 如果没有分配规则，分配到公海池

2. **手动分配**：
   - 管理员可以手动分配
   - 销售可以申请重新分配

### 跟进规则

1. **跟进提醒**：
   - 超过 3 天未跟进，发送提醒
   - 超过 7 天未跟进，自动退回公海池

2. **跟进记录**：
   - 每次跟进必须记录
   - 记录包含活动类型、内容、下次跟进时间

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| LEAD_DUPLICATE_PHONE | 409 | 手机号重复 |
| LEAD_DUPLICATE_ADDRESS | 409 | 地址重复 |
| LEAD_NOT_FOUND | 404 | 线索不存在 |
| LEAD_ALREADY_ASSIGNED | 409 | 线索已分配 |
| LEAD_INVALID_STATUS | 422 | 线索状态无效 |
| LEAD_CANNOT_DELETE | 422 | 线索不能删除 |
| LEAD_CANNOT_CONVERT | 422 | 线索不能转客户 |

## 最佳实践

1. **创建线索前先查重**
   - 使用手机号查询是否已存在线索
   - 避免重复创建

2. **及时跟进**
   - 分配后 24 小时内首次跟进
   - 定期更新跟进记录

3. **合理设置意向等级**
   - 根据客户反应准确评估
   - 高意向客户优先跟进

4. **充分利用标签**
   - 使用标签标记客户特征
   - 便于后续筛选和统计
