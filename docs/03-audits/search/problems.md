# search 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/search

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 1 |
| 🟡 P2 — 规范/UX（建议改进） | 1 |
| **合计** | **3** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-P0-1] `actions.ts:35-44` — `highlightText` 函数生成 `<mark>$1</mark>` 原生 HTML，但**未对 `query` 中的 HTML 特殊字符进行转义**。若 `query` 包含 `<script>alert(1)</script>` 等 XSS 载荷，返回值会包含可执行的 HTML。调用方若用 `dangerouslySetInnerHTML` 渲染，将导致存储型 XSS。应在 `escapedQuery` 之前先用 `he.encode()` 或 `DOMPurify` 对 `text` 和 `query` 做 HTML 转义

---

## 🟠 P1 — 应当修复

- [x] [D4-P1-2] `actions.ts:138-139` — 权限判断函数 `hasPerm` 中，`permissions.includes('**') || permissions.includes('*')` 通配符逻辑**允许持有 `*` 权限的用户跨越所有权限限制**，搜索所有类型的数据（包括财务、渠道、工单等敏感数据）。应明确禁止通配符权限出现在搜索权限判断中，或使用 `checkPermission` 系统统一校验

---

## 🟡 P2 — 建议改进

- [x] [D8-P2-1] `actions.ts:643-685` — 每次搜索请求触发 **3 次 AuditService.log**（SEARCH + ACCESS + DETAIL），在高频搜索场景下（用户键入即发）将产生大量冗余审计记录，对数据库产生写入压力。建议合并为 1 次记录，或仅对包含敏感实体（财务/客户）的结果记录一次

---

## ✅ 表现良好项（无需修复）

- **D3 tenantId 隔离完整**：所有 12 个实体的查询均含 `eq(table.tenantId, tenantId)`
- **D3 Redis 搜索历史按用户隔离**：key 格式为 `search:history:{tenantId}:{userId}`，互不感染
- **D7 SQL 通配符过滤**：Zod transform 剔除 `%` 和 `_`，防止 LIKE 注入
- **D4 Promise.allSettled 并发搜索**：12 个实体并发查询，单次请求耗时等于最慢查询
- **D4 结果数量限制**：`limit` 最大 50，Zod 强制校验
- **D4 unstable_cache 缓存**：搜索结果缓存 60 秒，key 含 tenantId + query + scope + 权限列表哈希
