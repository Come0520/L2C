# 小程序前端 API (Miniprogram Frontend)

> 面向微信小程序端的全业务 RESTful API 模块，覆盖 **认证鉴权、CRM 客户管理、报价单、订单、售后、工程师任务** 等核心领域。

## 架构分层

```
src/app/api/miniprogram/
├── auth/                    # 认证鉴权 (密码登录/微信登录/手机号解密)
├── auth-utils.ts            # JWT Token 统一生成与验证工具
├── miniprogram-schemas.ts   # Zod 输入验证 Schema 集合 (全业务覆盖)
├── customers/               # 客户管理 (CRUD + 脱敏)
├── crm/                     # CRM 跟进活动
├── quotes/                  # 报价单管理 (创建/确认/详情)
├── orders/                  # 订单管理 (从报价单转换 + 幂等控制)
├── tasks/                   # 工程师任务 (打卡/测量/完工)
├── service/                 # 售后工单
├── dashboard/               # 看板统计 (含 LRU 缓存加速)
├── invite/                  # 团队邀请码
├── tenant/                  # 租户管理
├── upload/                  # 文件上传
├── __tests__/               # 单元 & E2E 测试套件
└── ...

src/shared/services/miniprogram/
├── cache.service.ts         # LRU 内存缓存 (Dashboard 等高频查询加速)
├── security.service.ts      # 限流 (RateLimiter) + 幂等控制 (IdempotencyGuard)
├── customer.service.ts      # 客户领域服务 (数据脱敏/审计日志)
└── order.service.ts         # 订单领域服务 (事务/审计日志)
```

## 核心安全机制

| 机制 | 组件 | 说明 |
|------|------|------|
| **JWT 鉴权** | `auth-utils.ts` | 所有路由统一 Token 验证，禁止内联解析 |
| **Zod 输入验证** | `miniprogram-schemas.ts` | 全业务场景 Schema 覆盖 |
| **租户隔离** | 所有 Service 层 | 数据库查询强制附加 `tenantId` 条件 |
| **频控限流** | `RateLimiter` | 令牌桶算法，防 CC 攻击和刷单 |
| **幂等控制** | `IdempotencyGuard` | 防止订单等关键操作重复提交 |
| **手机号脱敏** | `CustomerService` | 列表接口自动 `138****1234` 格式化 |
| **审计日志** | `AuditService` | 容灾设计，审计故障不中断核心业务 |

## API 速查表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 密码登录 |
| POST | `/auth/wx-login` | 微信授权登录 |
| POST | `/auth/decrypt-phone` | 手机号解密绑定 |
| GET/POST | `/customers` | 客户列表 / 快速创建 |
| POST | `/crm/activities` | 记录客户跟进 |
| GET/POST | `/quotes` | 报价单列表 / 新建 |
| GET | `/quotes/[id]` | 报价单详情 |
| POST | `/quotes/[id]/confirm` | 确认报价单 |
| GET/POST | `/orders` | 订单列表 / 从报价单转换 |
| GET | `/orders/[id]` | 订单详情 |
| POST | `/orders/payments` | 提交收款记录 |
| GET | `/dashboard` | 看板统计数据 |
| GET/POST | `/tasks` | 任务列表 / 创建 |
| POST | `/tasks/[id]/check-in` | 外勤打卡签到 |
| POST | `/tasks/[id]/measure-data` | 上传测量数据 |
| POST | `/service/tickets` | 发起售后工单 |

## 开发指南

### 运行测试
```bash
pnpm vitest run src/app/api/miniprogram/__tests__/ --reporter=verbose
```

### 路由开发规范
1. 所有路由使用 `getMiniprogramUser()` 进行认证
2. 使用 `miniprogram-schemas.ts` 中的 Schema 进行输入验证
3. 业务逻辑抽离到 `shared/services/miniprogram/` 服务层
4. 所有操作添加 `logger` 日志和 `try/catch` 错误兜底
5. 写操作建议添加 `AuditService.log()` 审计（容灾设计）
