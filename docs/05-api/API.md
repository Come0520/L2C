# L2C API Documentation (Mobile)

本文档记录了 L2C 系统的移动端 API 接口，主要供“师傅端”小程序/App 使用。

## 🔐 身份验证 (Authentication)

目前采用 Mock 令牌访问：
- **Header**: `Authorization: Bearer mk_{USER_ID}_{TIMESTAMP}`
- **说明**: `mk_` 前缀表示 Mock 模式，后接用户 ID。

## 📋 任务接口 (Tasks)

### 1. 获取任务列表
获取当前工人被分配的所有测量和安装任务。

- **URL**: `/api/mobile/tasks`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "measure | install",
      "docNo": "M202601120001",
      "status": "PENDING | COMPLETED",
      "customer": { "name": "张三", "phone": "138..." },
      "scheduledAt": "2026-01-12T...",
      "address": "..."
    }
  ]
}
```

## 🛠️ 后端服务 (Internal Actions)

系统核心逻辑通过 Next.js Server Actions 提供：
- **报价计算**: `QuoteCalculationService`
- **数据同步**: `sync-actions.ts`

详细的业务逻辑与 Drizzle Schema 请参考 [报价单需求.md](./docs/报价单需求.md)。
