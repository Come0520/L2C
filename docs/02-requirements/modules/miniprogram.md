# 小程序模块 (Miniprogram) 产品需求文档

> 文档版本：v1.0
> 最后更新：2026-02-21
> 模块路径：`miniprogram/`（前端）、`src/app/api/miniprogram/`（后端 API）

---

## 1. 模块概述

### 1.1 定位

为窗帘行业的**销售、测量、安装**外勤人员提供基于微信小程序的轻量化移动工作台。覆盖从客户获取到订单交付的全链路业务操作。

### 1.2 目标用户

| 角色 | 核心场景 |
|:---|:---|
| 销售 (SALES) | 客户管理、报价、下单、收款 |
| 测量师 (MEASURER) | 现场签到、提交测量数据 |
| 安装工 (INSTALLER) | 签到、完工签名、拍照上传 |
| 管理员 (ADMIN) | 邀请员工、配置租户、设置销售目标 |

### 1.3 技术架构

```
┌─────────────────────────────┐
│     微信小程序前端 (WXML)     │
│  19 个页面模块 + WeUI 组件库  │
└────────────┬────────────────┘
             │ HTTPS + Bearer Token
┌────────────▼────────────────┐
│    Next.js API Routes       │
│  35 个路由 · Zod 校验 · JWT  │
│  Drizzle ORM · PostgreSQL   │
└─────────────────────────────┘
```

---

## 2. 认证体系

### 2.1 三种登录方式

| 方式 | 路由 | 适用场景 |
|:---|:---|:---|
| 密码登录 | `POST /auth/login` | 账号密码用户 |
| 微信授权 | `POST /auth/wx-login` | 微信快捷登录 |
| 手机号快捷 | `POST /auth/decrypt-phone` | 手机号一键登录 |

### 2.2 安全策略

- **JWT 有效期**：7 天（HS256 签名）
- **输入校验**：全部路由使用 Zod Schema 验证
- **租户隔离**：所有查询强制 `tenantId` 过滤
- **审计追踪**：19 个写操作接入 `AuditService.log`
- **错误隐藏**：生产环境不返回 `error.message` 技术细节

---

## 3. API 路由目录

### 3.1 认证模块 (Auth)

| 方法 | 路径 | 权限 | 说明 |
|:---|:---|:---|:---|
| POST | `/auth/login` | 公开 | 账号密码登录 |
| POST | `/auth/wx-login` | 公开 | 微信 code 换取 openId |
| POST | `/auth/decrypt-phone` | 公开 | 手机号解密并登录/注册 |

### 3.2 邀请模块 (Invite)

| 方法 | 路径 | 权限 | 说明 |
|:---|:---|:---|:---|
| POST | `/invite/generate` | ADMIN/MANAGER | 生成 6 位邀请码 |
| POST | `/invite/accept` | 公开 | 接受邀请并加入租户 |
| GET | `/invite/list` | ADMIN | 邀请记录列表 |
| GET | `/invite/qrcode` | 登录 | 获取邀请二维码 |

### 3.3 客户模块 (Customers)

| 方法 | 路径 | 权限 | 说明 |
|:---|:---|:---|:---|
| GET | `/customers` | 登录 | 客户列表（分页、搜索、手机号脱敏） |
| POST | `/customers` | 登录 | 快速创建客户 |
| GET | `/crm/customers/[id]` | 登录 | 客户详情 |
| POST | `/crm/activities` | 登录 | 创建跟进活动 |

### 3.4 报价模块 (Quotes)

| 方法 | 路径 | 权限 | 说明 |
|:---|:---|:---|:---|
| POST | `/quotes` | 登录 | 创建报价单（含房间和商品项） |
| GET | `/quotes/[id]` | 登录 | 报价单详情 |
| POST | `/quotes/[id]/confirm` | 登录 | 客户签名确认报价 |

### 3.5 订单模块 (Orders)

| 方法 | 路径 | 权限 | 说明 |
|:---|:---|:---|:---|
| GET | `/orders` | 登录 | 订单列表（分页、状态筛选） |
| GET | `/orders/[id]` | 登录 | 订单详情 |
| POST | `/orders` | 登录 | 从报价单转换创建订单 |
| POST | `/orders/payments` | 登录 | 提交付款记录 |

### 3.6 任务模块 (Tasks)

| 方法 | 路径 | 权限 | 说明 |
|:---|:---|:---|:---|
| GET | `/tasks` | 登录 | 我的任务列表（测量/安装） |
| GET | `/tasks/[id]` | 登录 | 任务详情 |
| POST | `/tasks/[id]/check-in` | 登录 | GPS 现场签到 |
| POST | `/tasks/[id]/measure-data` | 登录 | 提交测量数据 |
| POST | `/engineer/tasks/[id]/complete` | 登录 | 安装完工（签名+拍照） |
| GET | `/engineer/tasks` | 登录 | 安装工任务列表 |
| GET | `/engineer/earnings` | 登录 | 安装工收入统计 |

### 3.7 租户模块 (Tenant)

| 方法 | 路径 | 权限 | 说明 |
|:---|:---|:---|:---|
| POST | `/tenant/apply` | 公开 | 提交租户入驻申请 |
| GET | `/tenant/status` | 登录 | 查询租户审核状态 |
| GET | `/tenant/payment-config` | ADMIN | 获取支付配置 |
| POST | `/tenant/payment-config` | ADMIN | 更新支付配置 |

### 3.8 其他模块

| 方法 | 路径 | 权限 | 说明 |
|:---|:---|:---|:---|
| GET | `/dashboard` | 登录 | 工作台数据聚合 |
| POST | `/upload` | 登录 | 通用文件上传 |
| GET | `/products` | 登录 | 商品列表 |
| GET | `/channels` | 登录 | 渠道列表 |
| GET | `/config` | 登录 | 小程序配置 |
| POST | `/calculate` | 登录 | 价格计算 |
| GET | `/payment/config` | 登录 | 支付方式查询 |
| GET/POST | `/sales/targets` | 登录/ADMIN | 销售目标查询/设置 |
| POST | `/service/tickets` | 登录 | 创建售后工单 |
| GET | `/service/tickets` | 登录 | 售后工单列表 |

---

## 4. 数据模型关系

```
用户 (users) ──┬── 客户 (customers) ── 跟进 (activities)
               │
               ├── 报价单 (quotes) ── 报价项 (quoteItems)
               │        │
               │        └── 订单 (orders) ── 付款 (paymentSchedules)
               │
               ├── 测量任务 (measureTasks) ── 测量数据 (measureSheets)
               │
               ├── 安装任务 (installTasks)
               │
               └── 邀请 (invitations)
```

---

## 5. 前端页面结构

| 模块 | 页面 | 功能 |
|:---|:---|:---|
| 登录 | `login/` | 密码/微信/手机号三种登录 |
| 工作台 | `workbench/` | 数据看板、快捷入口 |
| 客户 | `customers/`、`customer-detail/` | 列表、详情、跟进 |
| 报价 | `quotes/`、`quote-detail/`、`create-quote/` | 列表、详情、创建 |
| 订单 | `orders/`、`order-detail/` | 列表、详情、支付 |
| 任务 | `tasks/`、`task-detail/` | 测量/安装任务 |
| CRM | `crm/` | 客户关系管理 |
| 设置 | `settings/` | 租户配置 |

---

## 6. 质量基线

## 6. 质量基线 (Maturity L5 Standard)

| 指标 | L4 标准 | L5 升级增强 (当前状态) |
|:---|:---|:---|
| 输入校验 | 100% Zod Schema | 100% 覆盖 + 精细化错误拦截 |
| 审计追踪 | 100% 写操作 | 100% 覆盖 + **审计容灾设计 (Audit Fault-Tolerance)** |
| 性能缓存 | LRU Dashboard | **CacheService (300s) 全量字典缓存 + Cache-Control (60s)** |
| 安全加固 | JWT + 权限校验 | **RateLimiter (令牌桶) + IdempotencyGuard (幂等) + 频控** |
| 代码质量 | TS 0 错误 | **0 as any 纯净度 + 100% Service 层 JSDoc + 统一日志规范** |
| 测试覆盖 | 基本覆盖 | **饱和式测试覆盖 (65+ 用例) + 领域隔离 Mock** |

---

## 7. 性能规范 (Performance Specs)

- **全局配置** (`/config`): 5 分钟强缓存 (Server + Client)
- **业务字典** (`/products`等): 5 分钟强缓存 (Server + Client)
- **个人列表** (`/orders`, `/customers`): 1 分钟私人缓存 (`Cache-Control: private`)
- **工作台** (`/dashboard`): 15 秒极速内存缓存

---

## 8. 安全规范 (Security Specs)

- **幂等控制**: 关键交易接口 (`POST /orders`) 24 小时幂等期
- **频控阈值**: 
  - 报价创建: 3 次 / 5 秒
  - 售后/反馈: 2 次 / 5 秒
  - 邀请接受: 2 次 / 5 秒 (基于客户端特征)
