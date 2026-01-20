# Webhook 事件文档

> L2C 系统 Webhook 事件规范和订阅指南

## 概述

L2C 系统在关键业务节点触发 Webhook 事件，允许第三方系统实时接收业务数据变更通知。

## 事件订阅

### 注册 Webhook 端点

```http
POST /api/v1/webhooks
Content-Type: application/json
Authorization: Bearer {token}

{
  "url": "https://your-server.com/webhook",
  "events": ["order.created", "order.status_changed"],
  "secret": "your-webhook-secret"
}
```

### 响应

```json
{
  "success": true,
  "data": {
    "id": "webhook-uuid",
    "url": "https://your-server.com/webhook",
    "events": ["order.created", "order.status_changed"],
    "status": "ACTIVE",
    "createdAt": "2026-01-20T10:00:00Z"
  }
}
```

## 事件列表

### 线索事件

| 事件 | 说明 |
|------|------|
| `lead.created` | 线索创建 |
| `lead.assigned` | 线索分配 |
| `lead.converted` | 线索转客户 |
| `lead.invalid` | 线索标记无效 |

### 客户事件

| 事件 | 说明 |
|------|------|
| `customer.created` | 客户创建 |
| `customer.updated` | 客户信息更新 |

### 报价单事件

| 事件 | 说明 |
|------|------|
| `quote.created` | 报价单创建 |
| `quote.approved` | 报价单审批通过 |
| `quote.rejected` | 报价单审批拒绝 |
| `quote.converted` | 报价单转订单 |

### 订单事件

| 事件 | 说明 |
|------|------|
| `order.created` | 订单创建 |
| `order.status_changed` | 订单状态变更 |
| `order.halted` | 订单叫停 |
| `order.resumed` | 订单恢复 |
| `order.completed` | 订单完成 |

### 任务事件

| 事件 | 说明 |
|------|------|
| `task.measure.dispatched` | 测量任务派单 |
| `task.measure.completed` | 测量任务完成 |
| `task.install.dispatched` | 安装任务派单 |
| `task.install.completed` | 安装任务完成 |

### 财务事件

| 事件 | 说明 |
|------|------|
| `payment.received` | 收款到账 |
| `invoice.created` | 发票开具 |

## 事件格式

所有 Webhook 请求使用统一格式：

```json
{
  "id": "event-uuid",
  "type": "order.status_changed",
  "timestamp": "2026-01-20T10:30:00Z",
  "tenantId": "tenant-uuid",
  "data": {
    "orderId": "order-uuid",
    "orderNo": "ORD20260120001",
    "previousStatus": "PENDING_MEASURE",
    "currentStatus": "MEASURING",
    "changedAt": "2026-01-20T10:30:00Z",
    "changedBy": "user-uuid"
  }
}
```

## 签名验证

每个 Webhook 请求都包含签名头用于验证：

```
X-Webhook-Signature: sha256=xxxxxx
X-Webhook-Timestamp: 1705737000
```

### 验证签名

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret, timestamp) {
  const data = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  return signature === `sha256=${expectedSignature}`;
}
```

## 重试机制

| 重试次数 | 延迟 |
|----------|------|
| 第 1 次 | 1 分钟 |
| 第 2 次 | 5 分钟 |
| 第 3 次 | 30 分钟 |
| 第 4 次 | 2 小时 |
| 第 5 次 | 12 小时 |

超过 5 次重试失败后，Webhook 将被标记为失败。

## 响应要求

- 响应状态码：`2xx` 表示成功
- 响应超时：10 秒
- 无需响应内容

---

*更新日期：2026-01-20*
