# ai-rendering 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/ai-rendering

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 2 |
| 🟡 P2 — 规范/UX（建议改进） | 3 |
| **合计** | **6** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-006-R9] `actions/generate.ts:220-228` 和 `241-249` — `generateAiRendering` 函数的两处 `UPDATE aiRenderings SET ... WHERE eq(aiRenderings.id, renderingId)` **缺少 `tenantId` 过滤**（D3-006 TOCTOU 第9次复现）。攻击者可通过猜测其他租户的 `renderingId` 篡改其渲染记录状态或错误信息

---

## 🟠 P1 — 应当修复

- [x] [D2-P1-1] `actions/generate.ts:163,198,213,216,251` — 多处使用 `console.error`、`console.warn`，未使用项目统一的 `logger`，导致日志无结构化输出、无 `tenantId/userId` 上下文，运维排障困难

- [x] [D3-P1-2] `actions/generate.ts:106-114` — **TOCTOU 积分并发消耗漏洞**：`generateAiRendering` 在前置步骤使用 `getCreditBalance()` 查询余额，然后在几秒钟后的最终阶段（甚至不在一起的事务中）才记录 `creditsUsed`。在高并发场景下，同一个租户的多个并发请求都能通过最初的余额校验，导致最终消耗的积分超过剩余额度限制（透支）。

---

## 🟡 P2 — 建议改进

- [x] [D2-P2-1] `actions/generate.ts:231` — `revalidateTag('ai-renderings-${tenantId}', {})` 第二参数 `{}` 为无效参数（`revalidateTag` 只接受一个字符串参数），应去除多余参数

- [x] [D6-P2-2] `actions/__tests__` 中仅 1 个测试文件，缺少积分不足时被拒绝、D3-006 跨租户更新防护、Gemini 调用失败时记录为 FAILED 状态等关键测试用例

- [x] [D8-P2-3] `actions/template-actions.ts` — SUPER_ADMIN 管理器接口（`createTemplate`、`updateTemplate`、`toggleTemplateStatus`、`deleteTemplate`）均缺少 `AuditService.log` 审计日志，无法追踪管理员的配置变更历史。

---

## ✅ 表现良好项（无需修复）

- **D3 认证校验**：函数入口处 `await auth()` 验证会话，无会话直接返回错误
- **D3 积分前置检查**：调用 Gemini API 前先校验余额是否充足，防止恶意滥用
- **D8 错误恢复**：Gemini 调用失败时将渲染记录更新为 FAILED，保持数据一致性
- **D4 OSS 降级回退**：OSS 上传失败时回退使用 Base64（而非直接报错中断），提升用户体验
