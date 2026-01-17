# 安装模块 API

> 安装模块提供安装任务管理、师傅分配、安装执行、安装确认等功能，支持安装全流程管理。

## 概述

安装模块是 L2C 系统的核心模块之一，负责管理所有安装相关信息。系统支持安装任务管理、师傅分配、安装签到、安装结果确认、安装评分等功能。

### 核心功能

- 安装任务管理（创建、查询、更新、删除）
- 师傅分配和调度
- 安装签到和位置记录
- 安装结果确认
- 安装评分和反馈
- 安装费用管理

---

## 1. 查询安装任务列表

查询当前租户的所有安装任务。

### 接口信息
- **URL**: `GET /api/v1/installation/tasks`
- **认证**: 需要
- **权限**: `installation.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 任务状态：PENDING/DISPATCHED/IN_PROGRESS/COMPLETED |
| installerId | string | 否 | 安装师傅 ID |
| customerId | string | 否 | 客户 ID |
| orderId | string | 否 | 订单 ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "taskNo": "INS-1705296000000",
      "orderId": "uuid",
      "orderNo": "ORD2026011500001",
      "customerId": "uuid",
      "customerName": "张三",
      "customerPhone": "13800138000",
      "status": "DISPATCHED",
      "installerId": "uuid",
      "installerName": "李四",
      "installerPhone": "13800138001",
      "scheduledAt": "2026-01-20T10:00:00Z",
      "assignedAt": "2026-01-15T10:00:00Z",
      "address": "广东省深圳市南山区阳光小区1栋201",
      "notes": "客户要求上午安装",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 2. 查询安装任务详情

根据任务 ID 查询安装任务详细信息。

### 接口信息
- **URL**: `GET /api/v1/installation/tasks/{id}`
- **认证**: 需要
- **权限**: `installation.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "taskNo": "INS-1705296000000",
    "orderId": "uuid",
    "orderNo": "ORD2026011500001",
    "customerId": "uuid",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "status": "DISPATCHED",
    "installerId": "uuid",
    "installerName": "李四",
    "installerPhone": "13800138001",
    "scheduledAt": "2026-01-20T10:00:00Z",
    "assignedAt": "2026-01-15T10:00:00Z",
    "address": "广东省深圳市南山区阳光小区1栋201",
    "notes": "客户要求上午安装",
    "checkInAt": null,
    "checkInLocation": null,
    "actualLaborFee": null,
    "adjustmentReason": null,
    "rating": null,
    "confirmedBy": null,
    "confirmedAt": null,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z",
    "order": {
      "id": "uuid",
      "orderNo": "ORD2026011500001",
      "totalAmount": "5000.00",
      "status": "CONFIRMED"
    },
    "customer": {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000"
    },
    "installer": {
      "id": "uuid",
      "name": "李四",
      "phone": "13800138001"
    }
  }
}
```

---

## 3. 创建安装任务

创建新的安装任务。

### 接口信息
- **URL**: `POST /api/v1/installation/tasks`
- **认证**: 需要
- **权限**: `installation.create`

### 请求参数

```json
{
  "orderId": "uuid",
  "customerId": "uuid",
  "address": "广东省深圳市南山区阳光小区1栋201",
  "scheduledAt": "2026-01-20T10:00:00Z",
  "notes": "客户要求上午安装",
  "installerId": "uuid"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 是 | 关联订单 ID |
| customerId | string | 是 | 客户 ID |
| address | string | 否 | 安装地址 |
| scheduledAt | string | 否 | 计划安装时间 |
| notes | string | 否 | 备注 |
| installerId | string | 否 | 安装师傅 ID（如果提供，任务状态为 DISPATCHED） |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "message": "Installation task created",
  "data": {
    "id": "uuid",
    "taskNo": "INS-1705296000000",
    "status": "DISPATCHED",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **任务编号**：系统自动生成任务编号（格式：INS + 时间戳）
2. **初始状态**：如果指定了 installerId，状态为 DISPATCHED；否则为 PENDING
3. **分配时间**：如果指定了 installerId，自动记录分配时间
4. **订单验证**：关联订单必须存在且属于当前租户

---

## 4. 分配安装师傅

将安装任务分配给指定的安装师傅。

### 接口信息
- **URL**: `PUT /api/v1/installation/tasks/{id}/dispatch`
- **认证**: 需要
- **权限**: `installation.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |

### 请求参数

```json
{
  "installerId": "uuid",
  "scheduledAt": "2026-01-20T10:00:00Z"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| installerId | string | 是 | 安装师傅 ID |
| scheduledAt | string | 否 | 计划安装时间（可更新） |

### 响应示例

```json
{
  "success": true,
  "message": "Task dispatched successfully"
}
```

### 业务规则

1. **状态更新**：任务状态更新为 DISPATCHED
2. **分配时间**：自动记录分配时间
3. **计划时间**：可以更新计划安装时间

---

## 5. 安装签到

安装师傅到达现场后进行签到。

### 接口信息
- **URL**: `PUT /api/v1/installation/tasks/{id}/check-in`
- **认证**: 需要
- **权限**: `installation.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |

### 请求参数

```json
{
  "location": {
    "latitude": 22.5431,
    "longitude": 114.0579,
    "address": "广东省深圳市南山区阳光小区1栋201"
  }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | object | 否 | 签到位置信息（JSON） |

### 响应示例

```json
{
  "success": true,
  "message": "Checked in successfully"
}
```

### 业务规则

1. **状态更新**：任务状态更新为 IN_PROGRESS
2. **签到时间**：自动记录签到时间
3. **位置记录**：记录签到时的位置信息

---

## 6. 更新安装结果

更新安装结果信息。

### 接口信息
- **URL**: `PUT /api/v1/installation/tasks/{id}/result`
- **认证**: 需要
- **权限**: `installation.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |

### 请求参数

```json
{
  "actualLaborFee": 500,
  "adjustmentReason": "安装难度较大，费用调整"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| actualLaborFee | number | 否 | 实际劳务费用 |
| adjustmentReason | string | 否 | 费用调整原因 |

### 响应示例

```json
{
  "success": true,
  "message": "Result updated"
}
```

---

## 7. 确认安装

确认安装完成。

### 接口信息
- **URL**: `PUT /api/v1/installation/tasks/{id}/confirm`
- **认证**: 需要
- **权限**: `installation.confirm`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |

### 请求参数

```json
{
  "actualLaborFee": 500,
  "adjustmentReason": "安装难度较大，费用调整",
  "rating": 5
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| actualLaborFee | number | 是 | 实际劳务费用（必须大于 0） |
| adjustmentReason | string | 否 | 费用调整原因 |
| rating | number | 否 | 评分（1-5） |

### 响应示例

```json
{
  "success": true,
  "message": "Installation confirmed successfully"
}
```

### 业务规则

1. **状态更新**：任务状态更新为 COMPLETED
2. **完成时间**：自动记录完成时间
3. **确认人**：记录确认人信息
4. **劳务费用**：必须提供实际劳务费用
5. **财务通知**：自动通知财务模块进行劳务结算

---

## 8. 拒绝安装

拒绝安装任务，将任务状态回退到已分配状态。

### 接口信息
- **URL**: `PUT /api/v1/installation/tasks/{id}/reject`
- **认证**: 需要
- **权限**: `installation.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |

### 请求参数

```json
{
  "reason": "客户临时取消安装"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 否 | 拒绝原因 |

### 响应示例

```json
{
  "success": true,
  "message": "Installation rejected, reverting to Dispatched"
}
```

### 业务规则

1. **状态回退**：任务状态回退到 DISPATCHED
2. **备注更新**：将拒绝原因添加到备注中

---

## 9. 查询推荐师傅

查询当前租户的安装师傅列表。

### 接口信息
- **URL**: `GET /api/v1/installation/workers`
- **认证**: 需要
- **权限**: `installation.read`

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "李四",
      "phone": "13800138001",
      "role": "INSTALLER",
      "status": "ACTIVE"
    },
    {
      "id": "uuid",
      "name": "王五",
      "phone": "13800138002",
      "role": "INSTALLER",
      "status": "ACTIVE"
    }
  ]
}
```

### 业务规则

1. **角色筛选**：只返回角色为 INSTALLER 的用户
2. **租户隔离**：只返回当前租户的师傅
3. **排序**：按姓名升序排列

---

## 10. 获取我的安装任务

获取当前登录用户的安装任务列表。

### 接口信息
- **URL**: `GET /api/v1/installation/my-tasks`
- **认证**: 需要
- **权限**: `installation.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 任务状态：PENDING/DISPATCHED/IN_PROGRESS/COMPLETED |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "taskNo": "INS-1705296000000",
      "orderId": "uuid",
      "orderNo": "ORD2026011500001",
      "customerId": "uuid",
      "customerName": "张三",
      "customerPhone": "13800138000",
      "status": "DISPATCHED",
      "scheduledAt": "2026-01-20T10:00:00Z",
      "address": "广东省深圳市南山区阳光小区1栋201",
      "notes": "客户要求上午安装",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| INSTALL_TASK_NOT_FOUND | 404 | 安装任务不存在 |
| INSTALL_TASK_ALREADY_EXISTS | 409 | 安装任务已存在 |
| INSTALL_TASK_INVALID_STATUS | 400 | 安装任务状态无效 |
| INSTALL_TASK_INVALID_LABOR_FEE | 400 | 劳务费用无效 |
| INSTALL_TASK_NO_INSTALLER | 400 | 未分配安装师傅 |
| INSTALLER_NOT_FOUND | 404 | 安装师傅不存在 |
| INSTALLER_INVALID_ROLE | 400 | 安装师傅角色无效 |

---

## 数据模型

### InstallTask

```typescript
interface InstallTask {
  id: string;
  tenantId: string;
  taskNo: string;
  orderId: string;
  customerId: string;
  status: 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  scheduledAt?: Date;
  completedAt?: Date;
  installerId?: string;
  assignedAt?: Date;
  address?: string;
  notes?: string;
  checkInAt?: Date;
  checkInLocation?: any;
  actualLaborFee?: string;
  adjustmentReason?: string;
  rating?: number;
  confirmedBy?: string;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Worker

```typescript
interface Worker {
  id: string;
  name: string;
  phone: string;
  role: 'INSTALLER';
  status: 'ACTIVE' | 'INACTIVE';
}
```

### CheckInLocation

```typescript
interface CheckInLocation {
  latitude: number;
  longitude: number;
  address?: string;
}
```
