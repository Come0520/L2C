# 移动端 API 差距分析报告

> 生成日期：2026-01-19
> 分析目的：评估现有 API 对移动端需求的满足程度

---

## 📊 总览

| 指标                | 数值       |
| ------------------- | ---------- |
| 需求定义的 API 总数 | **~60 个** |
| 现有实现的 API 数量 | **5 个**   |
| 覆盖率              | **~8%**    |

---

## ✅ 已实现的 API

| 路径                            | 方法 | 功能                          | 对应需求          |
| ------------------------------- | ---- | ----------------------------- | ----------------- |
| `/api/mobile/auth/login`        | POST | 手机号+密码登录，返回 JWT     | 通用认证 ✅       |
| `/api/mobile/auth/refresh`      | POST | Token 刷新                    | 通用认证 ✅       |
| `/api/mobile/tasks`             | GET  | 工人任务列表（测量+安装合并） | 工人端任务列表 ✅ |
| `/api/mobile/tasks/[type]/[id]` | GET  | 任务详情                      | 工人端任务详情 ✅ |
| `/api/mobile/upload/oss-token`  | GET  | OSS 上传凭证                  | 通用文件上传 ✅   |

---

## ❌ 未实现的 API（按角色分类）

### 1. 工人端（WORKER）- 缺失 12 个

| API（需求）                         | 优先级 | 说明               |
| ----------------------------------- | ------ | ------------------ |
| `POST /tasks/:id/accept`            | P0     | 接单/拒单          |
| `POST /tasks/:id/negotiate`         | P1     | 工费协商           |
| `POST /tasks/:id/confirm-schedule`  | P0     | 确认预约变更       |
| `POST /tasks/:id/mark-read`         | P1     | 标记已读备注       |
| `POST /tasks/:id/checkin`           | P0     | GPS 打卡           |
| `POST /tasks/:id/media`             | P0     | 上传照片/视频/语音 |
| `POST /tasks/:id/measurement`       | P0     | 提交测量数据       |
| `POST /tasks/:id/issue`             | P1     | 记录问题           |
| `POST /tasks/:id/complete`          | P0     | 提交完工           |
| `POST /tasks/:id/request-signature` | P1     | 申请客户签字       |
| `GET /earnings`                     | P1     | 收入统计           |
| `GET /earnings/details`             | P2     | 收入明细           |

### 2. 销售端（SALES）- 缺失 10 个

| API（需求）                | 优先级 | 说明       |
| -------------------------- | ------ | ---------- |
| `GET /leads?type=mine`     | P0     | 我的客户   |
| `GET /leads?type=pool`     | P1     | 公海客户   |
| `POST /leads/:id/claim`    | P1     | 领取客户   |
| `GET /leads/:id`           | P0     | 客户详情   |
| `POST /leads/:id/followup` | P0     | 添加跟进   |
| `POST /quotes/quick`       | P0     | 快速报价   |
| `GET /quotes`              | P1     | 报价列表   |
| `GET /quotes/:id/share`    | P1     | 分享报价   |
| `GET /performance`         | P1     | 个人业绩   |
| `GET /rankings`            | P2     | 销售排行榜 |

### 3. 老板端（BOSS）- 缺失 8 个

| API（需求）                     | 优先级 | 说明         |
| ------------------------------- | ------ | ------------ |
| `GET /dashboard/summary`        | P0     | 今日核心指标 |
| `GET /dashboard/trends`         | P1     | 趋势图表     |
| `GET /dashboard/funnel`         | P2     | 销售漏斗     |
| `GET /approvals?status=PENDING` | P0     | 待审批列表   |
| `GET /approvals/:id`            | P0     | 审批详情     |
| `POST /approvals/:id/approve`   | P0     | 批准         |
| `POST /approvals/:id/reject`    | P0     | 驳回         |
| `GET /team/rankings`            | P1     | 销售排行     |

### 4. 客户端（CUSTOMER）- 缺失 12 个

| API（需求）                        | 优先级 | 说明     |
| ---------------------------------- | ------ | -------- |
| `GET /orders`                      | P0     | 订单列表 |
| `GET /orders/:id`                  | P0     | 订单详情 |
| `GET /orders/:id/install-progress` | P0     | 安装进度 |
| `GET /appointments`                | P1     | 预约查看 |
| `POST /after-sales`                | P1     | 发起售后 |
| `GET /after-sales/:id`             | P1     | 售后进度 |
| `GET /referral/code`               | P2     | 推荐码   |
| `GET /referral/list`               | P2     | 推荐记录 |
| `GET /referral/rewards`            | P2     | 返利记录 |
| `GET /profile`                     | P1     | 个人信息 |
| `GET /addresses`                   | P2     | 地址管理 |
| `GET /reviews`                     | P2     | 评价记录 |

### 5. 采购端（PURCHASER）- 缺失 6 个

| API（需求）                             | 优先级 | 说明       |
| --------------------------------------- | ------ | ---------- |
| `GET /purchase/pending-pool`            | P0     | 待采购池   |
| `GET /purchase/orders`                  | P0     | 采购单列表 |
| `GET /purchase/orders/:id/logistics`    | P1     | 物流状态   |
| `GET /suppliers`                        | P1     | 供应商列表 |
| `POST /purchase/orders/:id/feedback`    | P2     | 问题反馈   |
| `POST /purchase/orders/:id/attachments` | P2     | 上传凭证   |

---

## 🔍 可复用的 Server Actions

以下现有 Server Actions 可作为 API 的业务逻辑基础：

| Action                   | 文件位置                | 可转换为 API |
| ------------------------ | ----------------------- | ------------ |
| `getMeasureTasks`        | `installation/actions/` | 工人端任务   |
| `getInstallTasks`        | `installation/actions/` | 工人端任务   |
| `checkinMeasureTask`     | `installation/actions/` | GPS 打卡     |
| `getLeads`               | `leads/actions/`        | 销售端客户   |
| `createFollowUp`         | `leads/actions/`        | 添加跟进     |
| `getQuotes`              | `quotes/actions/`       | 报价列表     |
| `createQuickQuote`       | `quotes/actions/`       | 快速报价     |
| `getApprovalTasks`       | `approval/actions/`     | 审批列表     |
| `approveTask`            | `approval/actions/`     | 审批处理     |
| `getOrders`              | `orders/actions/`       | 订单列表     |
| `getPendingPurchasePool` | `supply-chain/actions/` | 待采购池     |

---

## 📅 实施建议

### Phase 1：核心功能（预计 5 天）

**优先实现工人端核心流程**：

```
登录 → 任务列表 → 任务详情 → 接单 → GPS打卡 → 上传媒体 → 提交完工
```

需新增 API：

- [ ] `POST /tasks/:id/accept`
- [ ] `POST /tasks/:id/checkin`
- [ ] `POST /tasks/:id/media`
- [ ] `POST /tasks/:id/complete`

### Phase 2：客户端基础（预计 3 天）

```
微信登录 → 订单列表 → 安装进度 → 发起售后
```

需新增 API：

- [ ] 微信 OpenID 登录
- [ ] `GET /orders`
- [ ] `GET /orders/:id/install-progress`
- [ ] `POST /after-sales`

### Phase 3：销售+老板端（预计 4 天）

- [ ] 销售端报价分享
- [ ] 老板端审批
- [ ] BI 仪表盘

### Phase 4：采购+优化（预计 3 天）

- [ ] 采购端物流跟踪
- [ ] 推荐返利
- [ ] 性能优化

---

## 📎 相关文档

- [移动端需求规范](./移动端.md)
- [API 规范](../../04-api/api_specification.md)

---

_报告生成后请根据实际优先级调整实施顺序_
