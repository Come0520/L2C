# 移动端任务 API

> 移动端任务列表、任务详情、任务完成

## 模块概述

移动端任务模块负责移动端用户（测量师、安装师）的任务管理，包括任务列表、任务详情、接单、完成任务等功能。

### 任务类型

移动端支持两种任务类型：
1. **测量任务**（Measure Task）：测量师上门测量
2. **安装任务**（Install Task）：安装师上门安装

### 任务状态

#### 测量任务状态

| 状态 | 说明 |
|------|------|
| PENDING | 待分配 |
| DISPATCHING | 分配中 |
| PENDING_VISIT | 待上门 |
| PENDING_CONFIRM | 待确认 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

#### 安装任务状态

| 状态 | 说明 |
|------|------|
| PENDING | 待分配 |
| DISPATCHING | 分配中 |
| PENDING_VISIT | 待上门 |
| PENDING_CONFIRM | 待确认 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

## API 接口

### 1. 获取任务列表

获取当前用户的所有任务（测量任务和安装任务）。

#### 接口信息

- **URL**: `GET /api/mobile/tasks`
- **认证**: 需要

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 任务类型：measure/install/all，默认 all |
| status | string | 否 | 任务状态 |
| start_date | string | 否 | 开始日期（ISO 8601） |
| end_date | string | 否 | 结束日期（ISO 8601） |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "measure",
      "doc_no": "MS20260115ABC123",
      "status": "PENDING_VISIT",
      "customer": {
        "id": "uuid",
        "name": "张三",
        "phone": "13800138000",
        "default_address": "阳光小区1栋201"
      },
      "scheduled_at": "2026-02-01T10:00:00Z",
      "address": "阳光小区1栋201",
      "created_at": "2026-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "install",
      "doc_no": "INS20260115DEF456",
      "status": "PENDING_VISIT",
      "customer": {
        "id": "uuid",
        "name": "李四",
        "phone": "13800138001",
        "default_address": "阳光小区2栋301"
      },
      "scheduled_at": "2026-02-02T14:00:00Z",
      "address": "阳光小区2栋301",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### 2. 获取测量任务详情

获取单个测量任务的详细信息。

#### 接口信息

- **URL**: `GET /api/mobile/tasks/measure/{id}`
- **认证**: 需要

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measure_no": "MS20260115ABC123",
    "lead_id": "uuid",
    "lead_no": "LD20260110GHI789",
    "customer_id": "uuid",
    "customer": {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000",
      "wechat": "wx123456",
      "default_address": "阳光小区1栋201"
    },
    "status": "PENDING_VISIT",
    "type": "QUOTE_BASED",
    "quote_id": "uuid",
    "quote_no": "QT20260110JKL012",
    "scheduled_at": "2026-02-01T10:00:00Z",
    "assigned_worker_id": "uuid",
    "assigned_worker_name": "测量师A",
    "round": 1,
    "remark": "客户要求上午测量",
    "reject_count": 0,
    "is_fee_exempt": false,
    "fee_check_status": "PAID",
    "fee_approval_id": null,
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z",
    "sheets": [
      {
        "id": "uuid",
        "task_id": "uuid",
        "status": "DRAFT",
        "round": 1,
        "variant": "A",
        "site_photos": [
          "https://oss.example.com/photo1.jpg",
          "https://oss.example.com/photo2.jpg"
        ],
        "sketch_map": "https://oss.example.com/sketch.jpg",
        "created_at": "2026-01-15T10:00:00Z"
      }
    ],
    "items": [
      {
        "id": "uuid",
        "sheet_id": "uuid",
        "room_name": "客厅",
        "window_type": "STRAIGHT",
        "width": "3000.00",
        "height": "2800.00",
        "install_type": "TOP",
        "bracket_dist": "2500.00",
        "wall_material": "CONCRETE",
        "has_box": false,
        "box_depth": null,
        "is_electric": false,
        "remark": "普通窗帘",
        "segment_data": null,
        "created_at": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

### 3. 获取安装任务详情

获取单个安装任务的详细信息。

#### 接口信息

- **URL**: `GET /api/mobile/tasks/install/{id}`
- **认证**: 需要

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "task_no": "INS20260115DEF456",
    "order_id": "uuid",
    "order_no": "ORD20260110MNO345",
    "customer_id": "uuid",
    "customer": {
      "id": "uuid",
      "name": "李四",
      "phone": "13800138001",
      "wechat": "wx789012",
      "default_address": "阳光小区2栋301"
    },
    "status": "PENDING_VISIT",
    "scheduled_at": "2026-02-02T14:00:00Z",
    "installer_id": "uuid",
    "installer_name": "安装师B",
    "address": "阳光小区2栋301",
    "notes": "客户要求下午安装",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "order_id": "uuid",
        "order_item_id": "uuid",
        "product_name": "窗帘成品-001",
        "quantity": "5.00",
        "room_name": "客厅",
        "width": "3000.00",
        "height": "2800.00",
        "unit_price": "200.00",
        "subtotal": "1000.00",
        "status": "PENDING_INSTALL",
        "remark": "定制尺寸",
        "created_at": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

### 4. 接单

接受任务分配。

#### 接口信息

- **URL**: `POST /api/mobile/tasks/{type}/{id}/accept`
- **认证**: 需要

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 任务类型：measure/install |
| id | uuid | 是 | 任务 ID |

#### 请求参数

```json
{
  "remark": "接受任务，准时上门"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING_VISIT",
    "accepted_at": "2026-01-15T11:00:00Z"
  }
}
```

### 5. GPS 打卡

上门时进行 GPS 打卡。

#### 接口信息

- **URL**: `POST /api/mobile/tasks/{type}/{id}/check-in`
- **认证**: 需要

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 任务类型：measure/install |
| id | uuid | 是 | 任务 ID |

#### 请求参数

```json
{
  "latitude": 39.9042,
  "longitude": 116.4074,
  "address": "阳光小区1栋201",
  "photos": [
    "https://oss.example.com/photo1.jpg",
    "https://oss.example.com/photo2.jpg"
  ]
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| latitude | number | 是 | 纬度 |
| longitude | number | 是 | 经度 |
| address | string | 是 | 地址 |
| photos | string[] | 否 | 现场照片 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING_VISIT",
    "check_in_at": "2026-02-01T09:55:00Z",
    "check_in_location": {
      "latitude": 39.9042,
      "longitude": 116.4074,
      "address": "阳光小区1栋201"
    }
  }
}
```

### 6. 提交测量数据

提交测量数据。

#### 接口信息

- **URL**: `POST /api/mobile/tasks/measure/{id}/submit`
- **认证**: 需要

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

#### 请求参数

```json
{
  "variant": "A",
  "site_photos": [
    "https://oss.example.com/photo1.jpg",
    "https://oss.example.com/photo2.jpg"
  ],
  "sketch_map": "https://oss.example.com/sketch.jpg",
  "items": [
    {
      "room_name": "客厅",
      "window_type": "STRAIGHT",
      "width": "3000.00",
      "height": "2800.00",
      "install_type": "TOP",
      "bracket_dist": "2500.00",
      "wall_material": "CONCRETE",
      "has_box": false,
      "box_depth": null,
      "is_electric": false,
      "remark": "普通窗帘",
      "segment_data": null
    }
  ],
  "remark": "测量完成，客户满意"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| variant | string | 是 | 版本：A/B/C |
| site_photos | string[] | 是 | 现场照片 |
| sketch_map | string | 否 | 草图 |
| items | array | 是 | 测量项 |
| items[].room_name | string | 是 | 房间名称 |
| items[].window_type | string | 是 | 窗户类型：STRAIGHT/L_SHAPE/U_SHAPE/ARC |
| items[].width | decimal | 是 | 宽度（mm） |
| items[].height | decimal | 是 | 高度（mm） |
| items[].install_type | string | 否 | 安装类型：TOP/SIDE |
| items[].bracket_dist | decimal | 否 | 支架离地（mm） |
| items[].wall_material | string | 否 | 墙面材质：CONCRETE/WOOD/GYPSUM |
| items[].has_box | boolean | 否 | 是否有窗帘盒 |
| items[].box_depth | decimal | 否 | 窗帘盒深度（mm） |
| items[].is_electric | boolean | 否 | 是否电动 |
| items[].remark | text | 否 | 备注 |
| items[].segment_data | object | 否 | 分段数据（L 形、U 形） |
| remark | text | 否 | 备注 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measure_no": "MS20260115ABC123",
    "status": "PENDING_CONFIRM",
    "submitted_at": "2026-02-01T11:00:00Z",
    "sheet_id": "uuid"
  }
}
```

### 7. 提交安装数据

提交安装数据。

#### 接口信息

- **URL**: `POST /api/mobile/tasks/install/{id}/submit`
- **认证**: 需要

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |

#### 请求参数

```json
{
  "items": [
    {
      "order_item_id": "uuid",
      "status": "COMPLETED",
      "quantity_installed": "5.00",
      "photos": [
        "https://oss.example.com/photo1.jpg",
        "https://oss.example.com/photo2.jpg"
      ],
      "remark": "安装完成，客户满意"
    }
  ],
  "photos": [
    "https://oss.example.com/photo1.jpg",
    "https://oss.example.com/photo2.jpg"
  ],
  "remark": "安装完成，客户满意"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | array | 是 | 安装项 |
| items[].order_item_id | string | 是 | 订单项 ID |
| items[].status | string | 是 | 状态：COMPLETED/PARTIAL/FAILED |
| items[].quantity_installed | decimal | 是 | 安装数量 |
| items[].photos | string[] | 否 | 照片 |
| items[].remark | text | 否 | 备注 |
| photos | string[] | 是 | 现场照片 |
| remark | text | 否 | 备注 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "task_no": "INS20260115DEF456",
    "status": "PENDING_CONFIRM",
    "submitted_at": "2026-02-02T16:00:00Z"
  }
}
```

### 8. 完成任务

完成任务。

#### 接口信息

- **URL**: `POST /api/mobile/tasks/{type}/{id}/complete`
- **认证**: 需要

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 任务类型：measure/install |
| id | uuid | 是 | 任务 ID |

#### 请求参数

```json
{
  "completed_at": "2026-02-01T11:00:00Z",
  "remark": "任务完成，客户满意"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "completed_at": "2026-02-01T11:00:00Z"
  }
}
```

### 9. 取消任务

取消任务。

#### 接口信息

- **URL**: `POST /api/mobile/tasks/{type}/{id}/cancel`
- **认证**: 需要

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 任务类型：measure/install |
| id | uuid | 是 | 任务 ID |

#### 请求参数

```json
{
  "reason": "客户临时有事，改期",
  "verification_code": "123456"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelled_at": "2026-01-15T11:00:00Z",
    "cancel_reason": "客户临时有事，改期"
  }
}
```

### 10. 获取任务统计

获取任务统计数据。

#### 接口信息

- **URL**: `GET /api/mobile/tasks/statistics`
- **认证**: 需要

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期（ISO 8601） |
| end_date | string | 否 | 结束日期（ISO 8601） |
| type | string | 否 | 任务类型：measure/install/all，默认 all |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "total": 50,
    "by_type": {
      "measure": 30,
      "install": 20
    },
    "by_status": {
      "PENDING": 5,
      "PENDING_VISIT": 10,
      "PENDING_CONFIRM": 5,
      "COMPLETED": 28,
      "CANCELLED": 2
    },
    "completed_this_month": 25,
    "pending_tasks": 15
  }
}
```

## 业务规则

### 接单规则

1. **接单时限**：
   - 任务分配后 2 小时内必须接单
   - 超时未接单自动退回

2. **接单数量**：
   - 同一天最多接 5 个任务
   - 同一时间段只能接 1 个任务

### GPS 打卡规则

1. **打卡位置**：
   - 必须在客户地址 500 米范围内
   - 超出范围需要上传照片说明

2. **打卡时间**：
   - 预约时间前 30 分钟可以打卡
   - 预约时间后 30 分钟内必须打卡

### 提交数据规则

1. **测量数据**：
   - 必须上传现场照片
   - 必须填写所有测量项
   - 数据提交后不能修改

2. **安装数据**：
   - 必须上传安装照片
   - 必须填写所有安装项
   - 数据提交后不能修改

### 完成任务规则

1. **完成条件**：
   - 已提交数据
   - 已 GPS 打卡
   - 客户确认

2. **完成时限**：
   - 测量任务：预约时间后 4 小时内完成
   - 安装任务：预约时间后 8 小时内完成

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| TASK_NOT_FOUND | 404 | 任务不存在 |
| TASK_ALREADY_COMPLETED | 409 | 任务已完成 |
| TASK_CANNOT_ACCEPT | 422 | 任务不能接单 |
| TASK_CANNOT_CANCEL | 422 | 任务不能取消 |
| CHECK_IN_LOCATION_INVALID | 422 | 打卡位置无效 |
| CHECK_IN_TIME_INVALID | 422 | 打卡时间无效 |
| MEASURE_DATA_INVALID | 422 | 测量数据无效 |
| INSTALL_DATA_INVALID | 422 | 安装数据无效 |
| TASK_NOT_ASSIGNED | 422 | 任务未分配 |

## 最佳实践

1. **及时接单**
   - 任务分配后尽快接单
   - 避免超时未接单

2. **GPS 打卡**
   - 提前到达现场打卡
   - 确保位置准确

3. **数据提交**
   - 仔细核对测量数据
   - 上传清晰的照片

4. **任务完成**
   - 确认客户满意后再完成
   - 及时提交数据

5. **任务管理**
   - 合理安排任务时间
   - 避免任务冲突
