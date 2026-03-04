# L2C API 端点索引表 (API Endpoint Index)

> **更新日期:** 2026-03-04
> **统计:** 122 个路由文件 | 3 个主要端 + 5 个辅助端

---

## 📊 端点统计

| 端          | 路由文件数 | 主要 HTTP 方法     | 认证方式        |
| ----------- | ---------- | ------------------ | --------------- |
| miniprogram | 56         | GET / POST / PATCH | JWT (自签发)    |
| mobile      | 48         | GET / POST         | JWT (自签发)    |
| workbench   | 4          | GET                | Auth.js Session |
| auth        | 3          | GET / POST         | 混合            |
| webhooks    | 2          | POST               | 签名验证        |
| cron        | 2          | GET / POST         | Cron Secret     |
| v1          | 1          | POST               | OAuth           |
| 其他        | 6          | GET / POST         | 混合            |

---

## 🔸 Miniprogram (小程序端) — 56 个路由

### 认证 (Auth)

| 方法 | 路径                                  | 说明               | 角色限制 |
| ---- | ------------------------------------- | ------------------ | -------- |
| POST | `/api/miniprogram/auth/login`         | 密码登录           | 无       |
| POST | `/api/miniprogram/auth/wx-login`      | 微信授权登录       | 无       |
| POST | `/api/miniprogram/auth/decrypt-phone` | 微信手机号解密绑定 | 无       |
| POST | `/api/miniprogram/auth/refresh`       | Token 刷新         | 无       |
| POST | `/api/miniprogram/auth/select-tenant` | 多租户选择         | 无       |

### 线索 (Leads)

| 方法  | 路径                                   | 说明            | 角色限制                |
| ----- | -------------------------------------- | --------------- | ----------------------- |
| GET   | `/api/miniprogram/leads`               | 线索分页列表    | SALES / MANAGER / ADMIN |
| POST  | `/api/miniprogram/leads`               | 创建线索        | SALES / MANAGER / ADMIN |
| GET   | `/api/miniprogram/leads/[id]`          | 线索详情        | SALES / MANAGER / ADMIN |
| PATCH | `/api/miniprogram/leads/[id]`          | 更新线索        | SALES / MANAGER / ADMIN |
| POST  | `/api/miniprogram/leads/[id]/claim`    | 领取线索        | SALES                   |
| POST  | `/api/miniprogram/leads/[id]/release`  | 释放线索至公海  | SALES / MANAGER         |
| POST  | `/api/miniprogram/leads/[id]/convert`  | 转换为客户+报价 | SALES / MANAGER         |
| GET   | `/api/miniprogram/leads/[id]/followup` | 跟进记录列表    | SALES / MANAGER / ADMIN |
| POST  | `/api/miniprogram/leads/[id]/followup` | 添加跟进记录    | SALES / MANAGER / ADMIN |
| POST  | `/api/miniprogram/leads/[id]/void`     | 作废线索        | MANAGER / ADMIN         |

### 客户 (Customers)

| 方法 | 路径                                         | 说明                   | 角色限制                |
| ---- | -------------------------------------------- | ---------------------- | ----------------------- |
| GET  | `/api/miniprogram/customers`                 | 客户列表（手机号脱敏） | SALES / MANAGER / ADMIN |
| POST | `/api/miniprogram/customers`                 | 快速创建客户           | SALES / MANAGER / ADMIN |
| GET  | `/api/miniprogram/customers/referrals/stats` | 转介绍统计             | 登录即可                |

### CRM 跟进

| 方法 | 路径                                  | 说明         | 角色限制 |
| ---- | ------------------------------------- | ------------ | -------- |
| GET  | `/api/miniprogram/crm/activities`     | 跟进活动列表 | 登录即可 |
| POST | `/api/miniprogram/crm/activities`     | 记录跟进活动 | 登录即可 |
| GET  | `/api/miniprogram/crm/customers/[id]` | CRM 客户详情 | 登录即可 |

### 报价单 (Quotes)

| 方法 | 路径                                   | 说明         | 角色限制                |
| ---- | -------------------------------------- | ------------ | ----------------------- |
| GET  | `/api/miniprogram/quotes`              | 报价单列表   | SALES / MANAGER / ADMIN |
| POST | `/api/miniprogram/quotes`              | 新建报价单   | SALES / MANAGER / ADMIN |
| GET  | `/api/miniprogram/quotes/[id]`         | 报价单详情   | SALES / MANAGER / ADMIN |
| POST | `/api/miniprogram/quotes/[id]/confirm` | 客户确认签署 | SALES                   |

### 订单 (Orders)

| 方法 | 路径                                          | 说明               | 角色限制           |
| ---- | --------------------------------------------- | ------------------ | ------------------ |
| GET  | `/api/miniprogram/orders`                     | 订单列表           | 登录即可           |
| POST | `/api/miniprogram/orders`                     | 从报价单转换为订单 | SALES / MANAGER    |
| GET  | `/api/miniprogram/orders/[id]`                | 订单详情           | 登录即可           |
| POST | `/api/miniprogram/orders/payments`            | 提交收款记录       | SALES / MANAGER    |
| POST | `/api/miniprogram/orders/[id]/install-accept` | 安装验收           | CUSTOMER / MANAGER |

### 任务 (Tasks) — 通用

| 方法 | 路径                                         | 说明         | 角色限制        |
| ---- | -------------------------------------------- | ------------ | --------------- |
| GET  | `/api/miniprogram/tasks`                     | 任务列表     | 登录即可        |
| POST | `/api/miniprogram/tasks`                     | 创建任务     | MANAGER / ADMIN |
| GET  | `/api/miniprogram/tasks/[id]`                | 任务详情     | 登录即可        |
| POST | `/api/miniprogram/tasks/[id]/check-in`       | GPS 外勤签到 | WORKER          |
| POST | `/api/miniprogram/tasks/[id]/measure-data`   | 上传测量数据 | WORKER          |
| POST | `/api/miniprogram/tasks/[id]/measure-verify` | 测量数据审核 | MANAGER / ADMIN |
| POST | `/api/miniprogram/tasks/[id]/negotiate`      | 工费协商     | WORKER          |

### 工程师专属 (Engineer)

| 方法 | 路径                                            | 说明           | 角色限制 |
| ---- | ----------------------------------------------- | -------------- | -------- |
| GET  | `/api/miniprogram/engineer/tasks`               | 工程师任务列表 | WORKER   |
| GET  | `/api/miniprogram/engineer/tasks/biddable`      | 可竞标任务列表 | WORKER   |
| POST | `/api/miniprogram/engineer/tasks/[id]/complete` | 提交完工       | WORKER   |
| GET  | `/api/miniprogram/engineer/earnings`            | 收入统计       | WORKER   |
| GET  | `/api/miniprogram/engineer/schedule`            | 排班信息       | WORKER   |

### 销售专属 (Sales)

| 方法 | 路径                                    | 说明         | 角色限制        |
| ---- | --------------------------------------- | ------------ | --------------- |
| GET  | `/api/miniprogram/sales/targets`        | 销售目标查询 | SALES / MANAGER |
| POST | `/api/miniprogram/sales/targets`        | 设定销售目标 | MANAGER / ADMIN |
| GET  | `/api/miniprogram/sales/weekly-targets` | 周度目标查询 | SALES / MANAGER |
| POST | `/api/miniprogram/sales/weekly-targets` | 设定周度目标 | MANAGER / ADMIN |

### 邀请 (Invite)

| 方法 | 路径                               | 说明           | 角色限制        |
| ---- | ---------------------------------- | -------------- | --------------- |
| POST | `/api/miniprogram/invite/generate` | 生成邀请码     | MANAGER / ADMIN |
| POST | `/api/miniprogram/invite/accept`   | 接受邀请加入   | 无              |
| GET  | `/api/miniprogram/invite/list`     | 邀请记录列表   | MANAGER / ADMIN |
| GET  | `/api/miniprogram/invite/qrcode`   | 生成邀请二维码 | MANAGER / ADMIN |

### 租户 (Tenant)

| 方法 | 路径                                     | 说明         | 角色限制        |
| ---- | ---------------------------------------- | ------------ | --------------- |
| GET  | `/api/miniprogram/tenant/info`           | 租户基本信息 | 登录即可        |
| GET  | `/api/miniprogram/tenant/members`        | 成员列表     | MANAGER / ADMIN |
| POST | `/api/miniprogram/tenant/apply`          | 申请加入租户 | 无              |
| GET  | `/api/miniprogram/tenant/landing-qrcode` | 落地页二维码 | MANAGER / ADMIN |
| GET  | `/api/miniprogram/tenant/payment-config` | 支付配置     | MANAGER / ADMIN |
| POST | `/api/miniprogram/tenant/payment-config` | 更新支付配置 | ADMIN           |

### 其他

| 方法 | 路径                               | 说明                   | 角色限制        |
| ---- | ---------------------------------- | ---------------------- | --------------- |
| GET  | `/api/miniprogram/dashboard`       | 看板统计 (含 LRU 缓存) | MANAGER / ADMIN |
| GET  | `/api/miniprogram/channels`        | 渠道列表               | 登录即可        |
| GET  | `/api/miniprogram/products`        | 商品列表               | 登录即可        |
| GET  | `/api/miniprogram/config`          | 系统配置               | 登录即可        |
| POST | `/api/miniprogram/calculate`       | 报价计算引擎           | 登录即可        |
| GET  | `/api/miniprogram/payment/config`  | 支付通道配置           | 登录即可        |
| POST | `/api/miniprogram/service/tickets` | 发起售后工单           | CUSTOMER        |
| POST | `/api/miniprogram/upload/*`        | 文件上传               | 登录即可        |
| POST | `/api/miniprogram/log/error`       | 前端错误上报           | 登录即可        |

---

## 🔹 Mobile (移动端) — 48 个路由

### 认证 (Auth)

| 方法 | 路径                          | 说明            |
| ---- | ----------------------------- | --------------- |
| POST | `/api/mobile/auth/login`      | 手机号+密码登录 |
| POST | `/api/mobile/auth/refresh`    | Token 刷新      |
| POST | `/api/mobile/auth/wechat`     | 微信 H5 登录    |
| POST | `/api/mobile/auth/mfa/verify` | MFA 二次验证    |

### 线索 (Leads)

| 方法 | 路径                              | 说明     |
| ---- | --------------------------------- | -------- |
| GET  | `/api/mobile/leads`               | 线索列表 |
| GET  | `/api/mobile/leads/[id]`          | 线索详情 |
| POST | `/api/mobile/leads/[id]/claim`    | 领取线索 |
| POST | `/api/mobile/leads/[id]/convert`  | 转换客户 |
| POST | `/api/mobile/leads/[id]/followup` | 跟进记录 |
| POST | `/api/mobile/leads/[id]/void`     | 作废     |

### 报价单 (Quotes)

| 方法 | 路径                       | 说明     |
| ---- | -------------------------- | -------- |
| GET  | `/api/mobile/quotes`       | 报价列表 |
| POST | `/api/mobile/quotes/quick` | 快速报价 |
| GET  | `/api/mobile/quotes/[id]`  | 报价详情 |

### 订单 (Orders)

| 方法 | 路径                                       | 说明     |
| ---- | ------------------------------------------ | -------- |
| GET  | `/api/mobile/orders`                       | 订单列表 |
| GET  | `/api/mobile/orders/[id]/install-progress` | 安装进度 |

### 任务 (Tasks) — 18 个子路由

| 方法 | 路径                                       | 说明         |
| ---- | ------------------------------------------ | ------------ |
| GET  | `/api/mobile/tasks`                        | 任务列表     |
| GET  | `/api/mobile/tasks/[id]`                   | 任务详情     |
| POST | `/api/mobile/tasks/[id]/accept`            | 接单         |
| POST | `/api/mobile/tasks/[id]/checkin`           | GPS 打卡     |
| POST | `/api/mobile/tasks/[id]/complete`          | 提交完工     |
| POST | `/api/mobile/tasks/[id]/confirm`           | 确认任务     |
| POST | `/api/mobile/tasks/[id]/confirm-schedule`  | 确认排期     |
| GET  | `/api/mobile/tasks/[id]/confirmation-info` | 确认信息     |
| POST | `/api/mobile/tasks/[id]/install-accept`    | 安装验收     |
| POST | `/api/mobile/tasks/[id]/install-check-in`  | 安装签到     |
| POST | `/api/mobile/tasks/[id]/install-complete`  | 安装完工     |
| GET  | `/api/mobile/tasks/[id]/install-items`     | 安装项目列表 |
| POST | `/api/mobile/tasks/[id]/install-photos`    | 上传安装照片 |
| POST | `/api/mobile/tasks/[id]/issue`             | 上报问题     |
| POST | `/api/mobile/tasks/[id]/mark-read`         | 标记已读     |
| POST | `/api/mobile/tasks/[id]/measurement`       | 提交测量     |
| POST | `/api/mobile/tasks/[id]/media`             | 上传媒体文件 |
| POST | `/api/mobile/tasks/[id]/negotiate`         | 工费协商     |
| POST | `/api/mobile/tasks/[id]/request-signature` | 申请签字     |

### 审批 (Approvals)

| 方法 | 路径                                 | 说明       |
| ---- | ------------------------------------ | ---------- |
| GET  | `/api/mobile/approvals`              | 待审批列表 |
| POST | `/api/mobile/approvals/[id]/approve` | 批准       |
| POST | `/api/mobile/approvals/[id]/reject`  | 驳回       |

### 仪表盘 (Dashboard)

| 方法 | 路径                            | 说明         |
| ---- | ------------------------------- | ------------ |
| GET  | `/api/mobile/dashboard/summary` | 今日核心指标 |
| GET  | `/api/mobile/dashboard/trends`  | 趋势图表     |
| GET  | `/api/mobile/dashboard/funnel`  | 销售漏斗     |

### 其他

| 方法 | 路径                                | 说明         |
| ---- | ----------------------------------- | ------------ |
| GET  | `/api/mobile/earnings`              | 收入统计     |
| GET  | `/api/mobile/earnings/details`      | 收入明细     |
| GET  | `/api/mobile/purchase/pending-pool` | 待采购池     |
| GET  | `/api/mobile/purchase/orders`       | 采购单列表   |
| GET  | `/api/mobile/referral`              | 转介绍信息   |
| GET  | `/api/mobile/advisor`               | AI 导购顾问  |
| POST | `/api/mobile/after-sales`           | 发起售后     |
| GET  | `/api/mobile/upload/oss-token`      | OSS 上传凭证 |

---

## 🔶 Workbench (Web 工作台) — 4 个路由

| 方法 | 路径                           | 说明     | 认证    |
| ---- | ------------------------------ | -------- | ------- |
| GET  | `/api/workbench/alerts`        | 系统告警 | Auth.js |
| GET  | `/api/workbench/ar-aging`      | 应收账龄 | Auth.js |
| GET  | `/api/workbench/channel-stats` | 渠道统计 | Auth.js |
| GET  | `/api/workbench/todos`         | 待办事项 | Auth.js |

---

## 🔷 认证 (Auth) — 3 个路由

| 方法 | 路径                      | 说明                        |
| ---- | ------------------------- | --------------------------- |
| \*   | `/api/auth/[...nextauth]` | Auth.js 核心路由 (GET/POST) |
| POST | `/api/auth/magic-login`   | 魔法链接登录                |
| POST | `/api/auth/switch-tenant` | 切换租户                    |

---

## 🔵 Webhooks — 2 个路由

| 方法 | 路径                   | 说明           | 验证方式 |
| ---- | ---------------------- | -------------- | -------- |
| POST | `/api/webhooks/alipay` | 支付宝支付回调 | 签名验证 |
| POST | `/api/webhooks/wechat` | 微信支付回调   | 签名验证 |

---

## ⏰ Cron (定时任务) — 2 个路由

| 方法     | 路径                       | 说明           |
| -------- | -------------------------- | -------------- |
| GET/POST | `/api/cron/check-timeouts` | 检测超时任务   |
| GET/POST | `/api/cron/quotes/expire`  | 报价单过期处理 |

---

## 🔗 V1 开放平台 — 1 个路由

| 方法 | 路径                    | 说明             |
| ---- | ----------------------- | ---------------- |
| POST | `/api/v1/leads/webhook` | 外部线索推送入口 |

---

## 🌍 其他

| 方法 | 路径                        | 说明            | 认证     |
| ---- | --------------------------- | --------------- | -------- |
| GET  | `/api/health`               | 健康检查        | 无       |
| GET  | `/api/me`                   | 当前用户信息    | Auth.js  |
| GET  | `/api/public/landing-stats` | 落地页统计      | 无       |
| POST | `/api/monitoring/vitals`    | Web Vitals 上报 | 无       |
| POST | `/api/test-create-item`     | 🧪 测试用       | 开发模式 |
| POST | `/api/test-revalidate`      | 🧪 测试用       | 开发模式 |
