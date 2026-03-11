# 待办事项列表 (To-Do List)

> 持续更新 · 已完成项移至 docs/（已完成）.md

---

### [PERF-002] Approval 设计器页 force-dynamic 串行 Server Action 优化

**发现时间**：2026-03-11  
**发现场景**：E2E 第二批 approval-designer 测试，导致 10 条后续用例 did not run

**根因**：

- `settings/approvals/page.tsx` 声明 `export const dynamic = 'force-dynamic'`，强制每次全量重渲
- 串行执行两个 Server Action：`getMyQuoteConfig()` + `getApprovalFlows()`
- 客户端再加载 ReactFlow 渲染，总耗时远超 60s

**修复方案**：

1. 改串行为并行：`await Promise.all([getMyQuoteConfig(), getApprovalFlows()])`
2. 评估是否必须 `force-dynamic`，如无实时需求改为 `revalidate: 60`
3. `approval-designer.spec.ts` 中的 `timeout: 60000` 可放宽至 `90000` 作为临时兜底

**影响文件**：

- `src/app/(dashboard)/settings/approvals/page.tsx`
- `e2e/flows/approval-designer.spec.ts`

---

## 🟠 P1 · 重要

_(暂无亟待解决的 P1 相关问题)_

---

## 🟡 P2 · 一般

### [UI-001] 线索模块缺少批量操作复选框

**发现时间**：E2E 第一轮  
**描述**：`lead-bulk-operations.spec.ts` 测试 `table tbody tr input[type="checkbox"]` 找不到元素，测试被 skip  
**修复方向**：在线索列表 Table 组件中增加行级复选框列

### [UI-002] 线索重复检测弹窗交互逻辑未实现

**发现时间**：E2E 第一轮  
**描述**：`lead-duplicate-check.spec.ts` 的"阻止重复录入"测试缺少对应弹窗确认 UI  
**修复方向**：在创建线索表单提交时，增加重复检测弹窗 + 强制确认流程

---

## ✅ 已完成（近期）

- [x] [PERF-001] Finance 报表页 Server Component 串行 DB 查询性能优化（已添加 unstable_cache 与 Suspense，更新了兜底 E2E 等待）
- [x] `createLead` 函数修复：改用搜索输入框精确定位新线索，解决大数据量下的不稳定问题
- [x] E2E 第一批核心交易链路：17 passed / 4 skipped ✅（7.7 分钟）
- [x] E2E 第二批财务/审批/合同：7 passed / 10 did not run（性能超时，根因记录于 PERF-001/002）
- [x] E2E 第三批安装/售后/渠道：42 passed / 6 failed / 13 skipped（42.8分钟，6条失败均为性能超时，记录于 E2E-B3-001~006）
