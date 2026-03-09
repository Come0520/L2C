# 安装模块审计报告 - Round 3

> **审计日期**: 2026-03-08
> **审计人**: Antigravity Agent
> **范围**: `src/features/service/installation/` 全量审计（基于 Round 1/2 后的最新代码）
> **模式**: 默认整改模式（Default Remediation: 全部整改）

---

## 历史进度回顾

| Round | 日期 | 主要修复内容 |
|:-----|:-----|:------------|
| Round 1 | 2026-01-17 | 电子签名 Schema、冲突检测逻辑、物流检查逻辑 |
| Round 2 | 2026-01-17 | updateInstallChecklist Action、feeBreakdown 结构化、fieldDiscovery Action |

---

## 1. 需求-代码一致性（Requirement-Code Consistency）

| ID | Issue | Type | Location | 状态 |
|:---|:------|:-----|:---------|:-----|
| 1.1 | SmartWorkerSelector 的 `workload` 字段固定为 `0`，未展示真实当日任务数 | Mismatch | `smart-worker-selector.tsx:55` | 🟠 **待修复** |
| 1.2 | checkOut 时签名以 Base64 DataURL 字符串直接存入 `customerSignatureUrl`，而需求要求 OSS URL | Mismatch | `submit-completion-dialog.tsx:70-78` | 🟠 **待修复** |
| 1.3 | Checklist 照片上传仍为 TODO stub，`handlePhotoUpload` 不执行实际上传 | CodeMissing | `install-checklist.tsx:91-94` | 🟠 **待修复** |
| 1.4 | `checkPaymentBeforeInstall` 中月结渠道欠款 `channelDebt` 固定为 0（注释 NOTE 遗留），导致额度检查形同虚设 | Mismatch | `payment-check.ts:107-110` | 🔴 **严重** |
| 1.5 | `confirmInstallationSchema` 中实际工费 `actualLaborFee` 不支持 `feeBreakdown` 结构（Round 2 未完全修复） | Mismatch | `actions.ts:88-94` | 🟡 **低优先级** |
| 1.6 | `checkPaymentBeforeInstall` 未集成到派单流程 (`dispatchInstallTaskAction`)，安装前收款检查形同虚设 | CodeMissing | `actions.ts:386-512` | 🔴 **严重** |

---

## 2. 业务逻辑与代码质量（Business Logic & Code Quality）

| ID | Issue | Category | Location | 建议 |
|:---|:------|:---------|:---------|:-----|
| 2.1 | `payment-check.ts` 存在 N+1 串行查询：order → lead → channel → channelDebt，且 channelDebt 为 0（计算废弃） | Flow/Performance | `payment-check.ts:48-110` | 改用 JOIN 一次查询；修复 channelDebt 计算 |
| 2.2 | `getInstallWorkersAction` 仅按 `role=WORKER` 过滤，不考虑当日任务数，无法提供负载均衡建议 | Flow | `actions.ts:936-961` | 添加 `LEFT JOIN` 计算当日任务数并排序 |
| 2.3 | `actions.ts` 文件体积 962 行，超过 300 行单文件上限，维护困难 | Architecture | `actions.ts` | 拆分为 `actions/dispatch.ts`、`actions/checklist.ts`、`actions/lifecycle.ts` |
| 2.4 | `dispatchInstallTaskAction` 中 AuditService 被调用两次（L470 和 L499），产生重复审计记录 | Quality | `actions.ts:470,499` | 删除重复调用 L470-477 |
| 2.5 | `submit-completion-dialog.tsx` 中 `isLoading` 及相关代码被注释但遗留，引起代码噪声 | Quality | `submit-completion-dialog.tsx:41,46,65` | 清理注释代码 |
| 2.6 | `field-discovery-action.ts` 中 `import {} from 'next/cache'` 是空导入，无效代码 | Quality | `field-discovery-action.ts:8` | 删除空导入 |
| 2.7 | `getInstallWorkersAction` 的缓存 TTL 为 3600s（1小时），但师傅列表在实际场景下可能频繁变化 | Cache | `actions.ts:951` | 降低 TTL 至 300s 或使用 on-demand revalidate |

---

## 3. 安全审计（Security）

| ID | 漏洞 | Severity | Location | 修复 |
|:---|:-----|:---------|:---------|:-----|
| 3.1 | 签名 Base64 DataURL（约 50-200KB）存入数据库 `customerSignatureUrl` 字段，造成列膨胀，影响全表查询性能；且无防 XSS 验证 | **High** | `submit-completion-dialog.tsx:74-76` | 改为：前端 Canvas → Blob → Upload OSS → 得到 URL → 存 URL |
| 3.2 | `checkPaymentBeforeInstall` 函数中月结渠道计算 `channelDebt` 固定为 0，可导致任何月结客户绕过授信额度限制，完成欠款超额安装 | **High** | `payment-check.ts:107-110` | 正确实现渠道欠款聚合查询 |
| 3.3 | `checkOut` 前未验证 Checklist 照片是否已上传（required 项照片为 None 时仍可通过） | **Medium** | `actions.ts:650-653` | 在 checkOut 校验中增加 `required items 需有 photoUrl` 的条件 |

---

## 4. 数据库与性能审计（Database & Performance）

| ID | Issue | Category | Location | 修复 |
|:---|:------|:---------|:---------|:-----|
| 4.1 | `customerSignatureUrl` 字段存储 Base64 图片（数十万字节），造成 `installTasks` 表行膨胀 | Schema/Performance | DB: `install_tasks.customer_signature_url` | 改为存储 OSS URL 字符串（<200 chars） |
| 4.2 | `getInstallWorkersAction` 查询所有 WORKER 角色用户但不查询当日任务数，客户端无法排序；workload 硬编码为 0 | Performance | `actions.ts:936-961` | 添加 count 子查询计算当日任务数 |
| 4.3 | `payment-check.ts` 串行：order → lead → channel 三次独立查询，可合并为一次 JOIN | Performance | `payment-check.ts:48-113` | 使用 Drizzle `with` 关联查询 |
| 4.4 | `getInstallTaskById` 使用 `unstable_cache` 但 TTL 1小时，在任务状态频繁变更时可能返回脏数据 | Cache | `actions.ts:216-244` | 在每次状态变更后调用 `revalidateTag('install-task-'+id)` |

---

## 5. UI/UX 审计（UI/UX）

| ID | Issue | Category | Location | 修复 |
|:---|:------|:---------|:---------|:-----|
| 5.1 | SmartWorkerSelector 显示「当日任务: 0 个」给所有师傅，数据明显不实，影响决策质量 | InfoArch | `smart-worker-selector.tsx:117` | 后端返回真实 `workload` 值 |
| 5.2 | Checklist 照片上传按钮点击后仅弹出 toast「上传功能集成中...」，用户无法完成图证要求 | Feedback | `install-checklist.tsx:91-94` | 集成 OSS 上传，展示预览图 |
| 5.3 | `submit-completion-dialog` 的第一步「确认完工」仅展示一段文字，未显示已勾选 Checklist 项总结 | InfoArch | `submit-completion-dialog.tsx:96-98` | 展示 Checklist 完成状态摘要（已完成 N/M 项） |

---

## 6. 测试覆盖审计（Test Coverage）

| ID | Issue | Category | Location | 修复 |
|:---|:------|:---------|:---------|:-----|
| 6.1 | `checkOut` 核心路径（checklistStatus 校验、签名写入）无单元测试 | Unit | `__tests__/` | 新增 `checkout.test.ts` |
| 6.2 | `updateInstallChecklist` 的 `allCompleted` 计算逻辑无测试 | Unit | `__tests__/` | 新增至 `install-tasks.test.ts` |
| 6.3 | `checkPaymentBeforeInstall` 无测试，月结/现结两种路径均未覆盖 | Unit | `__tests__/` | 新增 `payment-check.test.ts` |
| 6.4 | `submitFieldDiscovery` 无测试 | Unit | `__tests__/` | 新增至 `install-tasks.test.ts` |
| 6.5 | `debug-db.test.ts` 文件为空文件（102 bytes），无任何测试逻辑 | Quality | `__tests__/debug-db.test.ts` | 删除或补充真实测试 |

---

## 7. 文档审计（Documentation）

| ID | Issue | Category | Location | 修复 |
|:---|:------|:---------|:---------|:-----|
| 7.1 | `submitFieldDiscoveryAction` 缺少 JSDoc 注释 | Comments | `logic/field-discovery-action.ts` | 补充 JSDoc |
| 7.2 | Round 3 审计报告 (本文件) 需纳入版本控制 | Requirements | `docs/03-audits/installation/` | 已创建 ✅ |
| 7.3 | 需求文档 `安装单.md` 未反映 `payment-check` 月结渠道欠款检查的最终设计决策 | Requirements | `docs/02-requirements/modules/安装单/安装单.md` | 更新需求文档说明收款检查规则 |

---

## 8. 可运维性审计（Observability & Operations）

| ID | Issue | Category | Location | 修复 |
|:---|:------|:---------|:---------|:-----|
| 8.1 | `dispatchInstallTaskAction` 中 `AuditService.recordFromSession` 被调用两次（L470 和 L499），产生重复记录 | AuditTrail | `actions.ts:470,499` | 删除重复调用 |
| 8.2 | `checkOut` 成功后未发送通知给销售/管理员（需确认流程） | Logging | `actions.ts:634-677` | 复用 `notifyTaskAssigned` 或新增 notify-on-checkout 逻辑 |

---

## 整改优先级与计划

### 🔴 P0（立即修复，影响业务正确性）

1. **[2.4] 删除重复 AuditService 调用**：删除 `actions.ts` L470-477 的重复记录
2. **[1.4 / 3.2] 修复 channelDebt 计算**：实现月结渠道欠款总额聚合查询
3. **[1.6] 将 paymentCheck 集成到派单流程**：在 `dispatchInstallTaskAction` 中调用 `checkPaymentBeforeInstall`
4. **[3.1 / 4.1] 签名改为 OSS URL**：`submit-completion-dialog` 先上传 Blob 到 OSS，再存 URL

### 🟠 P1（本迭代内修复）

5. **[2.2 / 5.1] 修复 workload 数据**：`getInstallWorkersAction` 返回当日任务数
6. **[1.3 / 5.2] 实现 Checklist 照片上传**：集成 OSS 上传到 `install-checklist.tsx`
7. **[2.3] 拆分 actions.ts**：按职责拆分到子文件
8. **[6.1 - 6.4] 补充单元测试**

### 🟡 P2（下一迭代）

9. **[2.7] 调整 worker 缓存 TTL**
10. **[5.3] 完工对话框展示 Checklist 摘要**
11. **[8.2] checkOut 后通知**

---

## Ignored Items（用户标记忽略）

| ID | Reason |
|:---|:-------|
| — | 暂无 |
