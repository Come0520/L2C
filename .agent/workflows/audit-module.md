---
description: 对指定模块执行完整八维审计，输出标准化问题报告到 docs/03-audits/{module}/problems.md
---

# /audit-module 工作流

> **调用格式**：`/audit-module module=leads`
> **输出路径**：`docs/03-audits/{module}/problems.md`

## 前置条件

- 必须提供 `module` 参数（对应 `src/features/` 下的目录名）
- 执行前先阅读 `docs/03-audits/错题本.md`，提取历史高频问题作为重点检查项

---

## Step 0：初始化

1. 读取 `docs/03-audits/audit-queue.md`，将对应模块的"审计状态"更新为 🔍 审计中
2. 读取 `docs/03-audits/错题本.md`，生成本次重点关注的历史错题清单
3. 确认目标目录 `src/features/{module}` 存在

---

## Step 1：执行八维审计

调用 `module-audit` skill，对 `src/features/{module}` 目录执行完整审计。

审计必须覆盖所有八个维度：
- D1: 需求与代码一致性
- D2: 代码质量（React 19 + Next.js 16，含 `react-best-practices` T1-T4 检查）
- D3: 安全性（鉴权、租户隔离、输入校验）
- D4: 数据库与性能（N+1、无 limit、索引）
- D5: UI/UX（三态、一致性、📱 响应式适配）
- D6: 测试覆盖
- D7: 文档完整性
- D8: 可运维性（审计日志、监控）

---

## Step 2：生成标准化问题报告

将审计结果写入 `docs/03-audits/{module}/problems.md`，格式**严格**按照以下模板：

```markdown
# {module} 模块审计问题报告

> 审计时间：{YYYY-MM-DD}
> 审计人：Agent
> 模块路径：src/features/{module}

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | N |
| 🟠 P1 — 质量/性能（应当修复） | N |
| 🟡 P2 — 规范/UX（建议改进） | N |
| **合计** | **N** |

---

## 🔴 P0 — 必须立即修复

<!-- 格式：- [ ] [维度-问题类型] 文件路径:行号 — 问题描述 -->
- [ ] [D3-001] `features/leads/actions/create.ts:12` — createLead Server Action 无鉴权，任何人可调用
- [ ] [D3-002] `features/leads/actions/list.ts:8` — 查询未包含 tenantId 过滤，数据跨租户泄露

## 🟠 P1 — 应当修复

- [ ] [D4-001] `features/leads/components/lead-list.tsx:45` — N+1 查询：循环内 await db.query

## 🟡 P2 — 建议改进

- [ ] [D5-001] `features/leads/components/lead-list.tsx` — 空状态（Empty State）缺失
- [ ] [D5-002] `features/leads/components/lead-table.tsx` — 表格无 overflow-x-auto 容器

---

## 🔖 错题本命中记录

> 本次审计中，以下历史错题在当前模块复现，审计结束后需更新错题本的复现记录：

- D3-001 Server Action 权限锁缺失 → 复现于 leads 模块

---

## ✅ 表现良好项（无需修复）

- D1: 需求文档与代码行为一致
- D6: 已有 E2E 测试覆盖核心流程
```

---

## Step 3：收尾

1. 将 `audit-queue.md` 中本模块的"审计状态"更新为 📋 待修复
2. 更新 `docs/03-audits/错题本.md`：
   - 新问题类型 → 追加到错题本末尾
   - 历史错题复现 → 在对应条目"复现记录"追加 `{module} ({date})`
3. 输出审计摘要：P0/P1/P2 各多少条，最严重的 3 个问题是什么

---

## 注意事项

- problems.md 中**每条问题必须包含精确的文件路径和行号**，否则修复 Agent 无法定位
- P0 问题必须有具体代码引用，不得只写"XX 功能有安全问题"
- 不要在 problems.md 中写修复建议的实现代码，只记录问题事实
