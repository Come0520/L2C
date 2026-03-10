# 模块审计队列 (Audit Queue)

> **调用方式**：
> - 审计：`/audit-module module=模块名` — 生成 `docs/03-audits/{module}/problems.md`
> - 修复：`/fix-module module=模块名` — 逐条修复 problems.md 中的问题
>
> **状态说明**：⬜ 未审计 | 🔍 审计中 | 📋 待修复 | 🔧 修复中 | ✅ 已完成

---

## 2026-03-10 夜间轮次 (Round-2)
> 目标：全量模块扫描，侧重 Next.js 16 异步 API、TOCTOU 漏洞及手机浏览器适配。

| 优先级 | 模块 | 路径 | 审计状态 | 修复状态 | 备注 |
|:---:|:---|:---|:---:|:---:|:---|
| P0 🔴 | finance | `src/features/finance` | ✅ 已完成 | ✅ 已完成 | |
| P0 🔴 | quotes | `src/features/quotes` | ✅ 已完成 | ✅ 已完成 | 无高危漏洞 |
| P0 🔴 | orders | `src/features/orders` | ✅ 已完成 | ✅ 已完成 | 包含 P1 性能问题 |
| P0 🔴 | auth | `src/features/auth` | ✅ 已完成 | ✅ 已完成 | 0 缺陷模块 |
| P1 🟠 | leads | `src/features/leads` | ✅ 已完成 | ✅ 已修复 | 2 P1, 1 P2 提报 (已全量修复性能与规范) |
| P1 🟠 | customers | `src/features/customers` | ✅ 已完成 | ✅ 已完成 | 0 缺陷模块 |
| P1 🟠 | after-sales | `src/features/after-sales` | 📋 待修复 | ✅ 已修复 | 1 P1, 2 P2 缺陷 |
| P1 🟠 | service | `src/features/service` | ✅ 已完成 | ✅ 已修复 | 3 P1, 1 P2 缺陷 |
| P2 🟡 | products | `src/features/products` | ✅ 已完成 | ✅ 已完成 | 1 P1, 2 P2 缺陷 (新增) |
| P2 🟡 | settings | `src/features/settings` | ✅ 已完成 | ✅ 已完成 | 2 P0, 3 P1, 4 P2 缺陷 |
| P2 🟡 | showroom | `src/features/showroom` | ✅ 已完成 | ✅ 已完成 | 1 P1, 1 P2 缺陷 (第二轮复核) |
| P2 🟡 | ai-rendering | `src/features/ai-rendering` | ✅ 已完成 | ✅ 已修复 | 1 P1, 1 P2 缺陷 已修复 |
| P2 🟡 | billing | `src/features/billing` | ✅ 已完成 | ✅ 已完成 | 1 P1, 1 P2 缺陷 (目前已全量修复验证) |
| P2 🟡 | dispatch | `src/features/dispatch` | ✅ 已完成 | ✅ 已修复 | 1 P2 缺陷 (已修复事务保障) |
| P2 🟡 | analytics | `src/features/analytics` | ✅ 已完成 | ✅ 已完成 | 0 缺陷 (全部修复通过) |
| P2 🟡 | channels | `src/features/channels` | ✅ 已完成 | ✅ 已修复 | 3 P2 缺陷皆已修复 (分页、审计日志、乐观锁并发防护) |
| P3 ⚪ | admin | `src/features/admin` | ✅ 已完成 | ✅ 已修复 | 1 P1, 2 P2 缺陷 (第二轮复核) |
| P3 ⚪ | platform | `src/features/platform` | 📋 待修复 | ✅ 已修复 | 1 P2 缺陷 (第二轮复核) |
| P3 ⚪ | monitoring | `src/features/monitoring` | 📋 待修复 | ✅ 已修复 | 1 P2 缺陷 (第二轮复核) |
| P3 ⚪ | search | `src/features/search` | ✅ 已完成 | ✅ 已完成 | 0 缺陷 (全部修复通过) |
| P3 ⚪ | upload | `src/features/upload` | ✅ 已完成 | ✅ 已完成 | 0 缺陷 (全部修复通过) |
| P3 ⚪ | approval | `src/features/approval` | ✅ 已完成 | ✅ 已修复 | 1 P2 缺陷 已修复 |
| P3 ⚪ | notifications | `src/features/notifications` | ✅ 已完成 | ✅ 已修复 | 1 P2 缺陷 已修复 |
| P3 ⚪ | pricing | `src/features/pricing` | ✅ 已完成 | ✅ 已修复 | 1 P1, 1 P2 缺陷皆已修复 |
| P3 ⚪ | sales | `src/features/sales` | ✅ 已完成 | ✅ 已修复 | 2 P2 缺陷皆已修复 (并发/事务控制) |
| P3 ⚪ | dashboard | `src/features/dashboard` | ✅ 已完成 | ✅ 已完成 | 0 缺陷 (全部修复通过) |

---

## 历史归档 (2026-03-10 日间轮次)
> 见 `docs/03-audits/archive/round-1-completed.md` (假设此文件存在)

---

*最后更新：2026-03-10 夜间*
