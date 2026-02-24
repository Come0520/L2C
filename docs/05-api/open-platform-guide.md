# L2C API 开放平台集成指南

> **版本:** v1.0
> **状态:** Draft
> **目标读者:** 意向对接 L2C 系统的第三方开发者（ERP厂商、智能家居中控厂商、企业微信应用服务商等）

## 1. 概述

L2C 核心架构遵循 API-First 设计理念，不仅支撑我们自有的多端应用（Web，小程序），同时也允许经过安全认证的外部第三方系统接入，实现业务流的跨系统集成和数据打通。

---

## 2. 认证机制 (Authentication)

L2C 开放平台采用无状态的 **JWT (JSON Web Token)** 机制进行跨应用互信认证。

### 2.1 获取凭证

为了接入，您需要联系商务或技术支持获取以下信息：
- `client_id`：分配给贵公司的应用标识
- `client_secret`：应用密钥，**必须严格保密**

### 2.2 Token 交换
暂不支持 Oauth 2.0 完整三方授权，目前采用客户端凭证 (Client Credentials) 模式：

```http
POST /api/oauth/token
Content-Type: application/json

{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials"
}
```

响应：
```json
{
  "access_token": "eyJhbG... (JWT token)",
  "expires_in": 7200,
  "token_type": "Bearer"
}
```

### 2.3 携带 Token 请求 API
所有的业务接口，都需要在 HTTP Request Header 中携带：
`Authorization: Bearer <access_token>`

---

## 3. 限流策略 (Rate Limiting)

为了保证平台的可用性，所有通过第三方客户端调用的接口均有严格的速率限制：

- **基础限制**：每个 `client_id` 每分钟允许的基础请求数为 `100 QPS`。
- **并发限制**：单个长耗时请求（如报表导出）最高并发数为 `5`。
- **限流响应**：当触发限流时，API 将返回 HTTP 状态码 `429 Too Many Requests`，并且在 Response Header 提供 `Retry-After` 字段指示需等待秒数。

---

## 4. 核心 API 端点列表

所有基础环境 URL 以 `https://api.your-domain.com/api/mobile` (暂作为统一移动端及开放网关入口) 。

### 4.1 线索与客户 (Leads & Customers)
- `POST /api/mobile/leads/hook` - 推送一条新线索到 L2C 系统（支持接收不同渠道如抖音、小红书的线索回传）。
- `GET /api/mobile/customers/:id` - 获取某个客户的脱敏画像和联系方式（需权控配置）。

### 4.2 报价与订单 (Quotes & Orders)
- `POST /api/mobile/orders/sync` - 接收外部 ERP 的订单状态同步请求。
- `GET /api/mobile/orders/:id/status` - 查询指定 L2C 订单目前所处的状态（例如：已付全款、正在排产）。

### 4.3 智能展厅素材 (Showroom)
- `GET /api/mobile/showroom/items` - 获取公开或已授权的商品、案例物料列表，支持外部系统的营销内容抓取。

---

## 5. Webhook 回调规范

L2C 支持将关键生命周期事件，通过 Webhook 推送至第三方系统。

### 5.1 配置入口
在 L2C 设置中心 -> 开发者选项 -> 添加 Webhook 监听服务地址。

### 5.2 支持的事件枚举 (Event Types)
- `ORDER_CREATED`: 新订单已创建（并付定金）。
- `ORDER_STATUS_CHANGED`: 订单状态扭转（如进入生产、进入安装阶段）。
- `PAYMENT_RECEIVED`: 核销到一笔新的人工/自动回款。

### 5.3 Payload 签名校验
发送至您回调地址的 HTTP 请求会在 Header 中包含签名 `X-L2C-Signature`。
该签名使用您的 Webhook Secret 通过 `HMAC-SHA256` 对请求体计算得出：

```javascript
// Node.js 验证签名示例
const crypto = require('crypto');
function verifySignature(payloadRef, secret, signatureHeader) {
  const hash = crypto.createHmac('sha256', secret).update(payloadRef).digest('hex');
  return hash === signatureHeader;
}
```

请在处理任何回调业务前，始终完成签名验证，以防止伪造的内网穿透攻击。

---

## 6. 其他对接守则 (Guidelines)
- **幂等性**：对于所有变更操作 (POST/PUT)，调用方需在 Header 中传递 `X-Request-Id` 以保证幂等性重试机制的正确运作。
- **分页参数**：列表端点默认使用 `page` 和 `pageSize` 控制分页。
- **数据一致性**：开放平台的接口可能会随着产品迭代发生 V1、V2 版本升级，对旧接口保持至少 6 个月的兼容期。
