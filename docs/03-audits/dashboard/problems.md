# dashboard 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/dashboard

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **6** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-P0-1] `actions.ts:186` — `getCachedStatsData` 的 `unstable_cache` 缓存 key 为**固定字符串 `['dashboard-stats']`**，不包含 `tenantId` 和 `userId`。这导致所有租户、所有用户共享同一个缓存条目：A 租户管理员刷新大盘后，B 租户管理员刷新将直接命中缓存并获得 A 租户的统计数据，**严重跨租户数据泄露**。应改为 `['dashboard-stats', tenantId, userId]` 作为 key，tags 改为 `['dashboard-stats', \`dashboard-stats-${tenantId}\`]`

---

## 🟠 P1 — 应当修复

- [x] [D3-P1-2] `actions.ts:142-172` — WORKER 角色的统计卡片展示"待处理测量"和"待处理安装"，但查询条件为**全租户所有 PENDING 任务**（`eq(measureTasks.tenantId, tenantId)`），未过滤 `assignedWorkerId = userId`。工人 A 会看到工人 B 的任务数量，数据归属错误

- [x] [D3-P1-3] `actions/config.ts:80` — `saveDashboardConfigAction` 开启数据库事务，但在事务内调用 `WorkbenchService.updateDashboardConfig(userId, data)`（第80行），该方法内部直接使用全局 `db` 连接而非传入的事务 `tx`，**破坏事务原子性**。若审计日志写入失败，WorkbenchService 的配置更新不会被回滚

- [x] [D4-P1-4] `actions.ts:213-222` — 每次调用 `getDashboardStats` 都会**无条件写入一条审计日志**（即使数据来自缓存命中）。仪表盘是高频刷新场景（每次切换页面或自动刷新），大量审计写入会对数据库造成 IOPS 压力。建议降低采样频率（如每日首次访问记录），或将审计日志改为异步写入

---

## 🟡 P2 — 建议改进

- [x] [D5-P2-1] `actions.ts:140` — SALES 角色的"本月业绩"硬编码为 `¥0`，未实现真实数据聚合。建议接入 `analytics` 模块的销售数据或临时标注为 `TODO`，避免用户产生误解

- [x] [D6-P2-2] 6 个测试文件中，缺少跨租户隔离测试（P0 问题的自动化防护，确保缓存 key 修复后不回退）

---

## ✅ 表现良好项（无需修复）

- **D3 基础认证**：使用 `createSafeAction` 包裹，自动保障仅登录用户可访问；角色使用 Zod 白名单枚举校验（第20-21行），无效 role 降级为 `GUEST`
- **D3 配置读取隔离**：`getDashboardConfigAction` 通过 `session.user.id` 获取用户配置，不存在跨用户读取风险
- **D4 多角色并行查询**：ADMIN/MANAGER 角色统计使用 `Promise.all` 并发执行 5 个查询
- **D8 配置变更审计**：`saveDashboardConfigAction`、`resetDashboardConfigAction` 均记录完整旧值/新值对比
