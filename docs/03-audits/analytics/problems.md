# analytics 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/analytics

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 2 |
| 🟡 P2 — 规范/UX（建议改进） | 3 |
| **合计** | **5** |

> ⚠️ 本模块**无 P0 安全问题**，是已审计模块中安全质量最高之一。

---

## 🟠 P1 — 应当修复

- [x] [D3-P1-1] `actions/dashboard-stats.ts:43`、`actions/sales-funnel.ts:41` — 判断是否为"管理层查看全员数据"时，使用**硬编码字符串** `session.user.role === 'MANAGER'`（或 `'ADMIN'`）而非 Permission 体系。若角色结构调整（如通过 role-override 拆分或新增管理角色），此处不会自动更新，导致部分管理层账号查询结果被错误地过滤为仅自己的数据。建议改为 `checkPermission(session, ANALYTICS_PERMISSIONS.VIEW_ALL)` 来判断是否有全员数据权限

- [x] [D4-P1-2] `actions/sales-funnel.ts:49-56` — `getSalesFunnel` **每次调用都先记录审计日志**，然后才命中缓存。由于审计日志写库在缓存检查逻辑之外（unstable_cache 内），即使数据命中缓存，也会每个请求都触发一次 `AuditService.log` 写库操作，在高频访问仪表盘场景（10+用户同时刷新）下将产生大量审计写入。建议将审计日志移至缓存 miss 路径或降低采样率 ✅ 已修复(2026-03-10)

---

## 🟡 P2 — 建议改进

- [x] [D4-P2-1] `actions/` 下全部 14 个报表 Action **均无日期范围最大跨度限制**。用户可传入 `startDate=2000-01-01&endDate=2030-12-31` 进行全量历史查询，虽然有 `unstable_cache` 缓存保护，但第一次命中时会触发全表聚合扫描，可能对大租户造成显著数据库负担。建议设置最大查询跨度（如 365 天）并在 Zod Schema 中校验

- [x] [D6-P2-1] `__tests__` 目录仅 1 个测试文件（测试覆盖率极低），全部 14 个报表 Action 几乎没有单元测试覆盖，尤其缺乏跨租户隔离校验测试

- [x] [D2-P2-2] `actions/profit-margin.ts:112` — 利润率计算 `grossProfit = revenue - cost`，两者均源自数据库 `SUM(CAST(... AS DECIMAL))` 后转为 JS `Number`，**在大额场景下（千万级）可能出现浮点精度丢失**。建议全程使用 `Decimal.js` 进行财务计算

---

## ✅ 表现良好项（无需修复）

- **D3 checkPermission 全覆盖**：所有 14 个报表均有 `checkPermission(session, ANALYTICS_PERMISSIONS.VIEW/VIEW_ALL)`，且利润率、目标达成等高敏感报表专用 `VIEW_ALL` 更高权限
- **D3 租户隔离**：所有聚合查询的 WHERE 首条件均为 `eq(table.tenantId, tenantId)`，无跨租户查询风险
- **D4 unstable_cache 标准使用**：全部报表均按 `[reportType-tenantId-salesId-startDate-endDate]` 构造缓存 Key，配合 `revalidate: 3600` 兜底，且 tag 格式统一为 `analytics-{tenantId}`，支持按租户批量失效
- **D4 并行查询**：所有多子报表查询均使用 `Promise.all` 并发执行，大幅减少等待时间
- **D3 __PLATFORM__ 保护**：所有报表均处理了 `tenantId === '__PLATFORM__'` 边界情况，返回空数据而非报错
- **D8 审计日志**：`sales-funnel.ts`、`profit-margin.ts` 等高敏感报表有 `AuditService.log` 记录每次查看操作
