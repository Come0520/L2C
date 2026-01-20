# 审批模块 API

> 审批模块提供审批流程管理、审批任务处理、审批历史查询等功能，支持灵活的审批流程配置。

## 概述

审批模块是 L2C 系统的核心模块之一，负责管理所有审批相关信息。系统支持审批流程定义、审批任务管理、审批决策处理、审批历史查询等功能。

### 核心功能

- 审批流程管理（创建、查询、更新、删除）
- 审批任务管理（查询、处理）
- 审批决策处理（通过、拒绝）
- 审批历史查询
- 审批流程配置

---

## 审批流程管理

### 1. 查询审批流程列表

查询当前租户的所有审批流程。

### 接口信息
- **URL**: `GET /api/v1/approval/flows`
- **认证**: 需要
- **权限**: `approval.flow.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 否 | 流程代码 |
| isActive | boolean | 否 | 是否启用 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "QUOTE_APPROVAL",
      "name": "报价单审批",
      "description": "报价单审批流程",
      "isActive": true,
      "nodes": [
        {
          "id": "uuid",
          "name": "部门经理审批",
          "approverRole": "MANAGER",
          "approverUserId": "uuid",
          "nodeType": "APPROVAL",
          "sortOrder": 1
        },
        {
          "id": "uuid",
          "name": "财务审批",
          "approverRole": "FINANCE",
          "approverUserId": "uuid",
          "nodeType": "APPROVAL",
          "sortOrder": 2
        }
      ],
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### 2. 查询审批流程详情

根据流程 ID 查询审批流程详细信息。

### 接口信息
- **URL**: `GET /api/v1/approval/flows/{id}`
- **认证**: 需要
- **权限**: `approval.flow.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 流程 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "code": "QUOTE_APPROVAL",
    "name": "报价单审批",
    "description": "报价单审批流程",
    "isActive": true,
    "nodes": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "flowId": "uuid",
        "name": "部门经理审批",
        "approverRole": "MANAGER",
        "approverUserId": "uuid",
        "nodeType": "APPROVAL",
        "sortOrder": 1,
        "createdAt": "2026-01-15T10:00:00Z"
      },
      {
        "id": "uuid",
        "tenantId": "uuid",
        "flowId": "uuid",
        "name": "财务审批",
        "approverRole": "FINANCE",
        "approverUserId": "uuid",
        "nodeType": "APPROVAL",
        "sortOrder": 2,
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

### 3. 创建审批流程

创建新的审批流程。

### 接口信息
- **URL**: `POST /api/v1/approval/flows`
- **认证**: 需要
- **权限**: `approval.flow.create`

### 请求参数

```json
{
  "code": "QUOTE_APPROVAL",
  "name": "报价单审批",
  "description": "报价单审批流程",
  "isActive": true,
  "nodes": [
    {
      "name": "部门经理审批",
      "approverRole": "MANAGER",
      "approverUserId": "uuid",
      "nodeType": "APPROVAL",
      "sortOrder": 1
    },
    {
      "name": "财务审批",
      "approverRole": "FINANCE",
      "approverUserId": "uuid",
      "nodeType": "APPROVAL",
      "sortOrder": 2
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 流程代码（唯一） |
| name | string | 是 | 流程名称 |
| description | string | 否 | 流程描述 |
| isActive | boolean | 否 | 是否启用，默认 true |
| nodes | array | 是 | 审批节点数组 |

### nodes 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 节点名称 |
| approverRole | string | 否 | 审批人角色 |
| approverUserId | string | 否 | 审批人 ID |
| nodeType | string | 否 | 节点类型：APPROVAL/COPY，默认 APPROVAL |
| sortOrder | integer | 是 | 排序顺序（1, 2, 3...） |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "QUOTE_APPROVAL",
    "name": "报价单审批",
    "description": "报价单审批流程",
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **流程代码**：流程代码必须在租户内唯一
2. **节点顺序**：节点按 sortOrder 升序排列
3. **审批人**：每个节点必须指定审批人（角色或用户）
4. **初始状态**：新流程默认为启用状态

---

### 4. 更新审批流程

更新审批流程信息。

### 接口信息
- **URL**: `PUT /api/v1/approval/flows/{id}`
- **认证**: 需要
- **权限**: `approval.flow.update`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 流程 ID |

### 请求参数

```json
{
  "name": "报价单审批流程",
  "description": "报价单审批流程（更新）",
  "isActive": false
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 流程名称 |
| description | string | 否 | 流程描述 |
| isActive | boolean | 否 | 是否启用 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "报价单审批流程",
    "description": "报价单审批流程（更新）",
    "isActive": false,
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

### 5. 删除审批流程

删除审批流程。

### 接口信息
- **URL**: `DELETE /api/v1/approval/flows/{id}`
- **认证**: 需要
- **权限**: `approval.flow.delete`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 流程 ID |

### 响应示例

```json
{
  "success": true,
  "message": "审批流程删除成功"
}
```

### 业务规则

1. **使用中检查**：不能删除正在使用的审批流程
2. **级联删除**：删除流程时同时删除所有关联的节点

---

## 审批任务管理

### 6. 查询待审批任务

查询当前用户的待审批任务。

### 接口信息
- **URL**: `GET /api/v1/approval/tasks/pending`
- **认证**: 需要
- **权限**: `approval.task.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| entityType | string | 否 | 实体类型：QUOTE/ORDER |
| flowCode | string | 否 | 流程代码 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "approvalId": "uuid",
      "nodeId": "uuid",
      "approverId": "uuid",
      "status": "PENDING",
      "comment": null,
      "actionAt": null,
      "createdAt": "2026-01-15T10:00:00Z",
      "approval": {
        "id": "uuid",
        "flowId": "uuid",
        "entityType": "QUOTE",
        "entityId": "uuid",
        "status": "PENDING",
        "requesterId": "uuid",
        "requesterName": "张三",
        "comment": "请审批报价单",
        "createdAt": "2026-01-15T10:00:00Z"
      },
      "flow": {
        "id": "uuid",
        "code": "QUOTE_APPROVAL",
        "name": "报价单审批"
      },
      "node": {
        "id": "uuid",
        "name": "部门经理审批",
        "nodeType": "APPROVAL"
      }
    }
  ]
}
```

---

### 7. 查询审批历史

查询当前用户提交的审批历史。

### 接口信息
- **URL**: `GET /api/v1/approval/history`
- **认证**: 需要
- **权限**: `approval.history.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 审批状态：PENDING/APPROVED/REJECTED/CANCELED |
| entityType | string | 否 | 实体类型：QUOTE/ORDER |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "flowId": "uuid",
      "entityType": "QUOTE",
      "entityId": "uuid",
      "status": "APPROVED",
      "requesterId": "uuid",
      "comment": "请审批报价单",
      "currentNodeId": null,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T11:00:00Z",
      "completedAt": "2026-01-15T11:00:00Z",
      "flow": {
        "id": "uuid",
        "code": "QUOTE_APPROVAL",
        "name": "报价单审批"
      }
    }
  ]
}
```

---

### 8. 查询审批详情

根据审批 ID 查询审批详细信息。

### 接口信息
- **URL**: `GET /api/v1/approval/{id}`
- **认证**: 需要
- **权限**: `approval.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 审批 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "approval": {
      "id": "uuid",
      "tenantId": "uuid",
      "flowId": "uuid",
      "entityType": "QUOTE",
      "entityId": "uuid",
      "status": "APPROVED",
      "requesterId": "uuid",
      "comment": "请审批报价单",
      "currentNodeId": null,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T11:00:00Z",
      "completedAt": "2026-01-15T11:00:00Z",
      "flow": {
        "id": "uuid",
        "code": "QUOTE_APPROVAL",
        "name": "报价单审批"
      }
    },
    "tasks": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "approvalId": "uuid",
        "nodeId": "uuid",
        "approverId": "uuid",
        "approverName": "李四",
        "status": "APPROVED",
        "comment": "同意",
        "actionAt": "2026-01-15T10:30:00Z",
        "createdAt": "2026-01-15T10:00:00Z",
        "node": {
          "id": "uuid",
          "name": "部门经理审批",
          "nodeType": "APPROVAL"
        }
      },
      {
        "id": "uuid",
        "tenantId": "uuid",
        "approvalId": "uuid",
        "nodeId": "uuid",
        "approverId": "uuid",
        "approverName": "王五",
        "status": "APPROVED",
        "comment": "同意",
        "actionAt": "2026-01-15T11:00:00Z",
        "createdAt": "2026-01-15T10:30:00Z",
        "node": {
          "id": "uuid",
          "name": "财务审批",
          "nodeType": "APPROVAL"
        }
      }
    ]
  }
}
```

---

## 审批决策处理

### 9. 提交审批申请

提交新的审批申请。

### 接口信息
- **URL**: `POST /api/v1/approval/submit`
- **认证**: 需要
- **权限**: `approval.submit`

### 请求参数

```json
{
  "entityType": "QUOTE",
  "entityId": "uuid",
  "flowCode": "QUOTE_APPROVAL",
  "comment": "请审批报价单"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| entityType | string | 是 | 实体类型：QUOTE/ORDER |
| entityId | string | 是 | 实体 ID |
| flowCode | string | 是 | 流程代码 |
| comment | string | 否 | 审批说明 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "message": "审批提交成功",
  "data": {
    "id": "uuid",
    "entityType": "QUOTE",
    "entityId": "uuid",
    "status": "PENDING",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **流程查找**：根据 flowCode 查找启用的审批流程
2. **节点创建**：创建审批实例和第一个节点的任务
3. **审批人分配**：根据节点配置分配审批人
4. **业务状态更新**：更新业务实体的状态为待审批
5. **重复提交**：同一实体不能重复提交审批

---

### 10. 处理审批决策

处理审批任务（通过或拒绝）。

### 接口信息
- **URL**: `PUT /api/v1/approval/tasks/{id}/process`
- **认证**: 需要
- **权限**: `approval.process`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 任务 ID |

### 请求参数

```json
{
  "action": "APPROVE",
  "comment": "同意"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 决策动作：APPROVE/REJECT |
| comment | string | 否 | 审批意见 |

### 响应示例

```json
{
  "success": true,
  "message": "处理成功"
}
```

### 业务规则

1. **权限验证**：只有任务分配的审批人才能处理
2. **状态限制**：只有待处理状态的任务可以处理
3. **通过决策**：
   - 更新任务状态为已通过
   - 查找下一个审批节点
   - 如果有下一个节点，创建新的待处理任务
   - 如果没有下一个节点，审批流程完成
4. **拒绝决策**：
   - 更新任务状态为已拒绝
   - 更新审批实例状态为已拒绝
   - 更新业务实体状态为已拒绝
5. **业务回调**：审批完成或拒绝时，回调更新业务实体状态

---

### 11. 撤回审批申请

撤回待处理的审批申请。

### 接口信息
- **URL**: `PUT /api/v1/approval/{id}/withdraw`
- **认证**: 需要
- **权限**: `approval.withdraw`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 审批 ID |

### 请求参数

```json
{
  "reason": "需要修改报价单"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 撤回原因 |

### 响应示例

```json
{
  "success": true,
  "message": "审批已撤回"
}
```

### 业务规则

1. **状态限制**：只有待处理状态的审批可以撤回
2. **权限验证**：只有审批申请人可以撤回
3. **状态更新**：更新审批实例状态为已取消
4. **业务回调**：更新业务实体状态为草稿

---

### 12. 转交审批任务

将审批任务转交给其他审批人。

### 接口信息
- **URL**: `PUT /api/v1/approval/tasks/{id}/transfer`
- **认证**: 需要
- **权限**: `approval.transfer`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 任务 ID |

### 请求参数

```json
{
  "toUserId": "uuid",
  "reason": "请假，转交给同事处理"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| toUserId | string | 是 | 转交目标用户 ID |
| reason | string | 是 | 转交原因 |

### 响应示例

```json
{
  "success": true,
  "message": "任务已转交"
}
```

### 业务规则

1. **权限验证**：只有当前审批人可以转交任务
2. **状态限制**：只有待处理状态的任务可以转交
3. **记录转交**：在任务备注中记录转交信息
4. **更新审批人**：更新任务的审批人为目标用户

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| APPROVAL_FLOW_NOT_FOUND | 404 | 审批流程不存在 |
| APPROVAL_FLOW_ALREADY_EXISTS | 409 | 审批流程已存在 |
| APPROVAL_FLOW_IN_USE | 400 | 审批流程正在使用中 |
| APPROVAL_FLOW_INVALID_CODE | 400 | 流程代码无效 |
| APPROVAL_FLOW_INVALID_NODES | 400 | 审批节点配置无效 |
| APPROVAL_NOT_FOUND | 404 | 审批不存在 |
| APPROVAL_ALREADY_SUBMITTED | 409 | 审批已提交 |
| APPROVAL_INVALID_STATUS | 400 | 审批状态无效 |
| APPROVAL_TASK_NOT_FOUND | 404 | 审批任务不存在 |
| APPROVAL_TASK_INVALID_STATUS | 400 | 审批任务状态无效 |
| APPROVAL_TASK_UNAUTHORIZED | 403 | 无权处理此任务 |
| APPROVAL_CANNOT_WITHDRAW | 400 | 不能撤回审批 |
| APPROVAL_CANNOT_TRANSFER | 400 | 不能转交任务 |

---

## 数据模型

### ApprovalFlow

```typescript
interface ApprovalFlow {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ApprovalNode

```typescript
interface ApprovalNode {
  id: string;
  tenantId: string;
  flowId: string;
  name: string;
  approverRole?: string;
  approverUserId?: string;
  nodeType: 'APPROVAL' | 'COPY';
  sortOrder: number;
  createdAt: Date;
}
```

### Approval

```typescript
interface Approval {
  id: string;
  tenantId: string;
  flowId: string;
  entityType: 'QUOTE' | 'ORDER';
  entityId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  requesterId: string;
  currentNodeId?: string;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### ApprovalTask

```typescript
interface ApprovalTask {
  id: string;
  tenantId: string;
  approvalId: string;
  nodeId: string;
  approverId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  actionAt?: Date;
  createdAt: Date;
}
```

### SubmitApprovalRequest

```typescript
interface SubmitApprovalRequest {
  entityType: 'QUOTE' | 'ORDER';
  entityId: string;
  flowCode: string;
  comment?: string;
}
```

### ProcessApprovalDecision

```typescript
interface ProcessApprovalDecision {
  taskId: string;
  action: 'APPROVE' | 'REJECT';
  comment?: string;
}
```
