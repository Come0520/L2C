# service/smart-dispatch 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/service/smart-dispatch

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 2 |
| 🟡 P2 — 规范/UX（建议改进） | 1 |
| **合计** | **3** |

> ℹ️ 本模块（`smart-dispatch/scoring.ts`）是纯工具函数文件，**无 Server Action、无 auth 调用、无数据库操作**，因此无 D3 租户隔离或权限类问题。安全审计重心放在算法正确性和模型完整性。

---

## 🟠 P1 — 应当修复

- [ ] [D2-P1-1] `smart-dispatch/scoring.ts:73-74` — 评分模型不完整。注释标注「负荷/评分等其他逻辑（略，暂给固定值）」，**工人当前任务负荷（activeTasks）、历史完成率、评分/口碑等核心派单因子均未实现**，导致智能派单退化为纯距离选人，评分最高只有 80 分（基础 50 + 距离 30），实际无法体现"智能"

- [ ] [D2-P1-2] `smart-dispatch/scoring.ts:46-76` — `calculateWorkerScore` 中技能匹配（第1维）注释为「假设已经 filter 过了」，**函数本身对 `worker.skills` 与 `task.category` 的匹配完全无任何判断**。若调用方未正确预过滤，技能不符的工人仍会获得 50 分基础分参与竞争，产生错误派单

---

## 🟡 P2 — 建议改进

- [ ] [D6-P2-1] `__tests__` 目录中仅 2 个测试文件，需补充：①边界距离测试（恰好 5km、10km、20km、50km 边界值）；②技能不匹配的工人不应被函数内部直接打分（应配合入参验证）；③两点均无坐标时的降级处理

---

## ✅ 表现良好项（无需修复）

- **D4 Haversine 公式正确**：`calculateDistance` 使用标准球面余弦定理实现，地球半径 6371km，计算结果精确
- **D4 Math.min(score, 100) 上限保护**：防止策略叠加时分数溢出 100
- **D7 TypeScript 接口约束**：`Worker` 和 `TaskContext` 有明确类型定义，`addressGeo` 使用 nullable union 处理无坐标的降级场景
