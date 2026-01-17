# 测量模块 API

> 测量模块提供测量任务的创建、指派、执行、审核等功能，支持测量数据管理、测量费用管理、测量师管理等功能。

## 概述

测量模块是 L2C 系统的核心模块之一，负责管理所有测量任务。系统支持测量任务创建、指派、执行、审核、测量数据管理、测量费用管理等功能。

### 核心功能

- 测量任务管理（创建、查询、更新、删除）
- 测量任务指派
- 测量师接单
- 现场签到
- 测量数据管理
- 测量费用管理
- 测量审核
- 测量数据同步

---

## 1. 创建测量任务

创建新的测量任务。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks`
- **认证**: 需要
- **权限**: `measurement.create`

### 请求参数

```json
{
  "leadId": "uuid",
  "customerId": "uuid",
  "scheduledAt": "2026-01-20T10:00:00Z",
  "type": "BLIND",
  "round": 1,
  "remark": "客户要求上午测量"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| leadId | string | 是 | 线索 ID |
| customerId | string | 是 | 客户 ID |
| scheduledAt | string | 是 | 预约时间 |
| type | string | 否 | 测量类型：BLIND/SHADE/SHUTTER，默认 BLIND |
| round | integer | 否 | 测量轮次，默认 1 |
| remark | string | 否 | 备注 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "measureNo": "MS202601150001",
    "leadId": "uuid",
    "customerId": "uuid",
    "status": "PENDING",
    "scheduledAt": "2026-01-20T10:00:00Z",
    "checkInAt": null,
    "checkInLocation": null,
    "type": "BLIND",
    "assignedWorkerId": null,
    "round": 1,
    "remark": "客户要求上午测量",
    "rejectCount": 0,
    "rejectReason": null,
    "isFeeExempt": false,
    "feeCheckStatus": "NONE",
    "feeApprovalId": null,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z",
    "completedAt": null
  }
}
```

### 业务规则

1. **测量单号**：系统自动生成，格式为 `MS + YYYYMMDD + 6位随机十六进制`
2. **初始状态**：新测量任务状态为 PENDING
3. **测量轮次**：首次测量轮次为 1，复测轮次递增

---

## 2. 查询测量任务列表

分页查询测量任务列表，支持多条件筛选和搜索。

### 接口信息
- **URL**: `GET /api/v1/measurement/tasks`
- **认证**: 需要
- **权限**: `measurement.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20 |
| status | string | 否 | 任务状态 |
| type | string | 否 | 测量类型：BLIND/SHADE/SHUTTER |
| assignedWorkerId | string | 否 | 分配的测量师 ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| search | string | 否 | 搜索关键词（测量单号/客户姓名） |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "measureNo": "MS202601150001",
      "leadId": "uuid",
      "customerId": "uuid",
      "customer": {
        "id": "uuid",
        "name": "张三",
        "phone": "13800138000"
      },
      "status": "DISPATCHING",
      "scheduledAt": "2026-01-20T10:00:00Z",
      "type": "BLIND",
      "assignedWorkerId": "uuid",
      "assignedWorker": {
        "id": "uuid",
        "name": "李四",
        "phone": "13800138001"
      },
      "round": 1,
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

## 3. 查询测量任务详情

根据测量任务 ID 查询测量任务详细信息。

### 接口信息
- **URL**: `GET /api/v1/measurement/tasks/{id}`
- **认证**: 需要
- **权限**: `measurement.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "measureNo": "MS202601150001",
    "leadId": "uuid",
    "customerId": "uuid",
    "status": "COMPLETED",
    "scheduledAt": "2026-01-20T10:00:00Z",
    "checkInAt": "2026-01-20T10:05:00Z",
    "checkInLocation": {
      "latitude": 22.5431,
      "longitude": 114.0579,
      "address": "广东省深圳市南山区"
    },
    "type": "BLIND",
    "assignedWorkerId": "uuid",
    "round": 1,
    "remark": "客户要求上午测量",
    "rejectCount": 0,
    "rejectReason": null,
    "isFeeExempt": false,
    "feeCheckStatus": "PAID",
    "feeApprovalId": null,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-20T12:00:00Z",
    "completedAt": "2026-01-20T12:00:00Z",
    "customer": {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000",
      "addresses": [
        {
          "id": "uuid",
          "label": "默认",
          "address": "阳光小区1栋201"
        }
      ]
    },
    "assignedWorker": {
      "id": "uuid",
      "name": "李四",
      "phone": "13800138001"
    },
    "measureSheets": [
      {
        "id": "uuid",
        "measureTaskId": "uuid",
        "status": "APPROVED",
        "measureItems": [
          {
            "id": "uuid",
            "roomId": "uuid",
            "roomName": "客厅",
            "windowType": "BLIND",
            "installType": "INSIDE",
            "wallMaterial": "CONCRETE",
            "width": 200,
            "height": 150,
            "quantity": 2,
            "notes": "窗户有遮挡"
          }
        ]
      }
    ]
  }
}
```

---

## 4. 指派测量任务

将测量任务指派给测量师。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/dispatch`
- **认证**: 需要
- **权限**: `measurement.dispatch`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 请求参数

```json
{
  "assignedWorkerId": "uuid",
  "scheduledAt": "2026-01-20T10:00:00Z"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| assignedWorkerId | string | 是 | 测量师 ID |
| scheduledAt | string | 否 | 预约时间 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "status": "DISPATCHING",
    "assignedWorkerId": "uuid",
    "scheduledAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 PENDING 状态的任务可以指派
2. **费用检查**：指派前检查测量费用状态
3. **通知测量师**：指派后会通知测量师

---

## 5. 测量师接单

测量师接受测量任务。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/accept`
- **认证**: 需要
- **权限**: `measurement.accept`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "status": "PENDING_VISIT",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 DISPATCHING 状态的任务可以接单
2. **权限限制**：只有被指派的测量师可以接单

---

## 6. 现场签到

测量师到达现场签到。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/check-in`
- **认证**: 需要
- **权限**: `measurement.checkIn`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 请求参数

```json
{
  "location": {
    "latitude": 22.5431,
    "longitude": 114.0579,
    "address": "广东省深圳市南山区",
    "accuracy": 10
  }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | object | 是 | 位置信息 |

### location 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| latitude | number | 是 | 纬度 |
| longitude | number | 是 | 经度 |
| address | string | 否 | 地址 |
| accuracy | number | 否 | 精度（米） |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "checkInAt": "2026-01-20T10:05:00Z",
    "checkInLocation": {
      "latitude": 22.5431,
      "longitude": 114.0579,
      "address": "广东省深圳市南山区"
    },
    "updatedAt": "2026-01-20T10:05:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 PENDING_VISIT 状态的任务可以签到
2. **位置验证**：系统会验证签到位置是否在合理范围内
3. **时间限制**：签到时间不能早于预约时间太多

---

## 7. 提交测量数据

测量师提交测量数据。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/submit`
- **认证**: 需要
- **权限**: `measurement.submit`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 请求参数

```json
{
  "photos": [
    "https://oss.example.com/photo1.jpg",
    "https://oss.example.com/photo2.jpg"
  ],
  "videos": [
    "https://oss.example.com/video1.mp4"
  ],
  "notes": "窗户尺寸正常",
  "measureItems": [
    {
      "roomId": "uuid",
      "roomName": "客厅",
      "windowType": "BLIND",
      "installType": "INSIDE",
      "wallMaterial": "CONCRETE",
      "width": 200,
      "height": 150,
      "quantity": 2,
      "notes": "窗户有遮挡"
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| photos | array | 否 | 照片 URL 数组 |
| videos | array | 否 | 视频 URL 数组 |
| notes | string | 否 | 备注 |
| measureItems | array | 是 | 测量项数组 |

### measureItems 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomId | string | 否 | 房间 ID |
| roomName | string | 是 | 房间名称 |
| windowType | string | 是 | 窗户类型：BLIND/SHADE/SHUTTER |
| installType | string | 是 | 安装类型：INSIDE/OUTSIDE/CEILING |
| wallMaterial | string | 是 | 墙面材质：CONCRETE/WOOD/METAL |
| width | number | 是 | 宽度（厘米） |
| height | number | 是 | 高度（厘米） |
| quantity | number | 是 | 数量 |
| notes | string | 否 | 备注 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "status": "PENDING_REVIEW",
    "measureSheetId": "uuid",
    "updatedAt": "2026-01-20T11:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 PENDING_VISIT 状态的任务可以提交
2. **必填项**：至少需要提供一个测量项
3. **自动创建**：提交后自动创建测量数据单

---

## 8. 审核测量数据

审核测量师提交的测量数据。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/review`
- **认证**: 需要
- **权限**: `measurement.review`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 请求参数

```json
{
  "approved": true,
  "comment": "测量数据准确"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| approved | boolean | 是 | 是否通过 |
| comment | string | 否 | 审核意见 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "status": "COMPLETED",
    "completedAt": "2026-01-20T12:00:00Z",
    "updatedAt": "2026-01-20T12:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 PENDING_REVIEW 状态的任务可以审核
2. **审核通过**：通过后任务状态变为 COMPLETED
3. **审核不通过**：不通过后任务状态变为 REJECTED，需要重新测量

---

## 9. 驳回测量任务

驳回测量任务，要求重新测量。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/reject`
- **认证**: 需要
- **权限**: `measurement.reject`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 请求参数

```json
{
  "reason": "测量数据不准确，需要重新测量"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 驳回原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "status": "REJECTED",
    "rejectCount": 1,
    "rejectReason": "测量数据不准确，需要重新测量",
    "updatedAt": "2026-01-20T12:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 PENDING_REVIEW 状态的任务可以驳回
2. **驳回次数**：记录驳回次数
3. **重新测量**：驳回后需要创建新的测量任务

---

## 10. 取消测量任务

取消测量任务。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/cancel`
- **认证**: 需要
- **权限**: `measurement.cancel`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 请求参数

```json
{
  "reason": "客户取消订单"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 取消原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "status": "CANCELLED",
    "updatedAt": "2026-01-20T12:00:00Z"
  }
}
```

### 业务规则

1. **状态限制**：只有 PENDING、DISPATCHING、PENDING_VISIT 状态的任务可以取消
2. **已签到**：已签到的任务不能取消

---

## 11. 申请测量费用豁免

申请测量费用豁免。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/fee-waiver`
- **认证**: 需要
- **权限**: `measurement.feeWaiver`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 请求参数

```json
{
  "reason": "VIP客户，首次测量免费"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 豁免原因 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "isFeeExempt": true,
    "feeCheckStatus": "WAIVED",
    "feeApprovalId": "uuid",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

### 业务规则

1. **审批流程**：豁免需要经过审批
2. **状态更新**：审批通过后更新费用状态为 WAIVED

---

## 12. 查询测量费用状态

查询测量任务的费用状态。

### 接口信息
- **URL**: `GET /api/v1/measurement/tasks/{id}/fee-status`
- **认证**: 需要
- **权限**: `measurement.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "status": "PENDING",
    "isPaid": false,
    "isFeeExempt": false,
    "feeAmount": "100.00",
    "message": "需要支付测量费用或申请豁免"
  }
}
```

---

## 13. 创建复测任务

创建复测任务。

### 接口信息
- **URL**: `POST /api/v1/measurement/tasks/{id}/remeasure`
- **认证**: 需要
- **权限**: `measurement.create`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 原测量任务 ID |

### 请求参数

```json
{
  "reason": "客户要求重新测量",
  "scheduledAt": "2026-01-25T10:00:00Z"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 复测原因 |
| scheduledAt | string | 否 | 预约时间 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601250001",
    "leadId": "uuid",
    "customerId": "uuid",
    "parentMeasureTaskId": "uuid",
    "status": "PENDING",
    "scheduledAt": "2026-01-25T10:00:00Z",
    "round": 2,
    "createdAt": "2026-01-20T12:00:00Z"
  }
}
```

### 业务规则

1. **轮次递增**：复测任务的轮次 = 原任务轮次 + 1
2. **关联原任务**：记录父任务 ID
3. **费用豁免**：复测任务默认豁免费用

---

## 14. 同步测量数据

同步测量数据到移动端。

### 接口信息
- **URL**: `GET /api/v1/measurement/tasks/{id}/sync`
- **认证**: 需要
- **权限**: `measurement.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "measureNo": "MS202601150001",
    "customerId": "uuid",
    "customer": {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000"
    },
    "addresses": [
      {
        "id": "uuid",
        "label": "默认",
        "address": "阳光小区1栋201"
      }
    ],
    "scheduledAt": "2026-01-20T10:00:00Z",
    "type": "BLIND",
    "round": 1,
    "remark": "客户要求上午测量",
    "previousMeasurements": [
      {
        "id": "uuid",
        "measureNo": "MS202601100001",
        "round": 1,
        "status": "COMPLETED",
        "completedAt": "2026-01-10T12:00:00Z"
      }
    ]
  }
}
```

### 业务规则

1. **历史数据**：包含历史测量数据供参考
2. **客户信息**：包含客户地址等信息

---

## 15. 测量任务统计

获取测量任务统计数据。

### 接口信息
- **URL**: `GET /api/v1/measurement/statistics`
- **认证**: 需要
- **权限**: `measurement.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| workerId | string | 否 | 测量师 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "totalTasks": 100,
    "completedTasks": 80,
    "pendingTasks": 10,
    "rejectedTasks": 5,
    "cancelledTasks": 5,
    "statusDistribution": {
      "PENDING": 10,
      "DISPATCHING": 5,
      "PENDING_VISIT": 5,
      "PENDING_REVIEW": 10,
      "COMPLETED": 80,
      "REJECTED": 5,
      "CANCELLED": 5
    },
    "typeDistribution": {
      "BLIND": 60,
      "SHADE": 30,
      "SHUTTER": 10
    },
    "avgCompletionTime": 2.5,
    "rejectRate": 0.05
  }
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| MEASURE_TASK_NOT_FOUND | 404 | 测量任务不存在 |
| MEASURE_TASK_ALREADY_EXISTS | 409 | 测量任务已存在 |
| MEASURE_TASK_CANNOT_CREATE | 422 | 测量任务不能创建 |
| MEASURE_TASK_CANNOT_DELETE | 422 | 测量任务不能删除 |
| MEASURE_TASK_CANNOT_CANCEL | 422 | 测量任务不能取消 |
| MEASURE_TASK_CANNOT_ASSIGN | 422 | 测量任务不能分配 |
| MEASURE_TASK_CANNOT_ACCEPT | 422 | 测量任务不能接单 |
| MEASURE_TASK_CANNOT_SUBMIT | 422 | 测量任务不能提交 |
| MEASURE_TASK_CANNOT_COMPLETE | 422 | 测量任务不能完成 |
| MEASURE_TASK_INVALID_STATUS | 400 | 测量任务状态无效 |
| MEASURE_TASK_NOT_ASSIGNED | 422 | 测量任务未分配 |
| MEASURE_TASK_ALREADY_COMPLETED | 409 | 测量任务已完成 |
| MEASURE_TASK_ALREADY_CANCELLED | 409 | 测量任务已取消 |
| MEASURE_SHEET_NOT_FOUND | 404 | 测量数据不存在 |
| MEASURE_SHEET_INVALID | 400 | 测量数据无效 |
| MEASURE_SHEET_INVALID_STATUS | 400 | 测量数据状态无效 |
| MEASURE_ITEM_NOT_FOUND | 404 | 测量项不存在 |
| MEASURE_ITEM_INVALID | 400 | 测量项无效 |
| MEASURE_ITEM_INVALID_WINDOW_TYPE | 400 | 窗户类型无效 |
| MEASURE_ITEM_INVALID_INSTALL_TYPE | 400 | 安装类型无效 |
| MEASURE_ITEM_INVALID_WALL_MATERIAL | 400 | 墙面材质无效 |
| CHECK_IN_LOCATION_INVALID | 422 | 打卡位置无效 |
| CHECK_IN_TIME_INVALID | 422 | 打卡时间无效 |
| MEASURE_DATA_INVALID | 422 | 测量数据无效 |

---

## 数据模型

### MeasureTask

```typescript
interface MeasureTask {
  id: string;
  tenantId: string;
  measureNo: string;
  leadId: string;
  customerId: string;
  status: 'PENDING' | 'DISPATCHING' | 'PENDING_VISIT' | 'PENDING_REVIEW' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  scheduledAt?: Date;
  checkInAt?: Date;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  type: 'BLIND' | 'SHADE' | 'SHUTTER';
  assignedWorkerId?: string;
  round: number;
  remark?: string;
  rejectCount: number;
  rejectReason?: string;
  isFeeExempt: boolean;
  feeCheckStatus: 'NONE' | 'PENDING' | 'PAID' | 'WAIVED';
  feeApprovalId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### MeasureSheet

```typescript
interface MeasureSheet {
  id: string;
  tenantId: string;
  measureTaskId: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  photos?: string[];
  videos?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}
```

### MeasureItem

```typescript
interface MeasureItem {
  id: string;
  tenantId: string;
  measureSheetId: string;
  roomId?: string;
  roomName: string;
  windowType: 'BLIND' | 'SHADE' | 'SHUTTER';
  installType: 'INSIDE' | 'OUTSIDE' | 'CEILING';
  wallMaterial: 'CONCRETE' | 'WOOD' | 'METAL';
  width: number;
  height: number;
  quantity: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
