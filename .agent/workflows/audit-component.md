---
description: 对指定 UI 组件执行六维审计，输出标准化问题报告到 docs/03-audits/components/{component}/problems.md
---

# /audit-component 工作流

> **调用格式**：`/audit-component component=header`
> **输出路径**：`docs/03-audits/components/{component}/problems.md`
> **组件路径**：`src/widgets/layout/` 或 `src/shared/ui/`

## 前置条件

- 必须提供 `component` 参数（对应组件的文件名，不含扩展名）
- 执行前先读取 `docs/03-audits/错题本.md` 中的 **C（组件类）** 章节，提取历史高频问题
- 读取 `docs/03-audits/component-audit-queue.md`，确认组件路径和当前状态

---

## Step 0：初始化

1. 读取 `docs/03-audits/component-audit-queue.md`，将对应组件的「审计状态」更新为 🔍 审计中
2. 读取 `docs/03-audits/错题本.md` 中 C 类错题，生成本次重点关注的历史错题清单
3. 确认目标组件文件存在（`src/widgets/layout/{component}.tsx` 或 `src/shared/ui/{component}.tsx`）

---

## Step 1：执行六维组件审计

对目标组件文件执行完整审计，覆盖以下六个维度：

- **C1: Props 类型安全**
  - Props 类型是否严格声明（无 `any`）
  - 必填/可选字段是否合理
  - 是否有 PropTypes 或 Zod 运行时校验（对外输入组件尤为重要）

- **C2: 渲染性能**（对照 `react-best-practices` T1-T4）
  - 是否有不必要的重渲染（缺 `memo`、`useCallback`、`useMemo`）
  - 是否存在在渲染函数内创建新对象/函数的情况
  - 大列表是否有虚拟滚动
  - 是否合理使用 `Suspense`/`lazy`

- **C3: 安全性**
  - 是否存在 `dangerouslySetInnerHTML`（若有，是否做了 DOMPurify 净化）
  - 用户输入是否在组件层做了校验（XSS 防护）
  - 敏感操作（删除/清空/重置）是否有 `action-confirm-dialog` 二次确认
  - 权限相关组件（如 `permission-guard`）逻辑是否正确

- **C4: UX 完整性**
  - 加载态（Skeleton/Spinner）是否完备
  - 空状态（Empty State）是否有方案
  - 错误态（Error）是否有优雅降级
  - 移动端响应式适配（参照错题本 D5-002）

- **C5: 无障碍（a11y）**
  - 交互元素是否有 `aria-label` / `aria-describedby`
  - 键盘导航是否支持（Tab/Enter/Escape）
  - 颜色对比度是否符合 WCAG AA（4.5:1）
  - 图标纯按钮是否有文字替代

- **C6: 可维护性**
  - 组件职责是否单一（不超过 200 行为宜）
  - 是否有单元测试覆盖
  - JSDoc 注释是否完整（Props 说明）
  - 是否有硬编码字符串应改为常量

---

## Step 2：生成标准化问题报告

创建目录 `docs/03-audits/components/{component}/`，写入 `problems.md`（严格遵守以下格式）：

```markdown
# {component} 组件审计问题报告

> 审计时间：{YYYY-MM-DD}
> 审计人：Agent
> 组件路径：src/widgets/layout/{component}.tsx 或 src/shared/ui/{component}.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   N   |
|    🟠 P1 — 性能/UX（应当修复）    |   N   |
|   🟡 P2 — 规范/a11y（建议改进）   |   N   |
|             **合计**              | **N** |

---

## 🔴 P0 — 必须立即修复

<!-- 格式：- [ ] [维度-问题类型] 文件路径:行号 — 问题描述 -->

- [ ] [C3-001] `shared/ui/permission-guard.tsx:42` — 权限检查未处理 roles 为空数组的边界情况，可能导致权限放行

## 🟠 P1 — 应当修复

- [ ] [C2-001] `widgets/layout/header.tsx:88` — 通知列表 map 内每次创建新函数，建议提取为 useCallback

## 🟡 P2 — 建议改进

- [ ] [C5-001] `widgets/layout/header.tsx:120` — 通知铃铛按钮缺少 aria-label，屏幕阅读器无法识别
- [ ] [C6-001] `widgets/layout/header.tsx` — 组件超过 250 行，建议拆分 NotificationBell 为独立文件

---

## 🔖 错题本命中记录

> 本次审计中，以下历史错题在当前组件复现：

- C1-001 Props 无类型声明 → 复现于 {component}

---

## ✅ 表现良好项（无需修复）

- C3: 无 dangerouslySetInnerHTML 使用
- C4: 加载态/空态/错误态完整
```

---

## Step 3：收尾

1. 将 `component-audit-queue.md` 中本组件的「审计状态」更新为 📋 待修复
2. 更新 `docs/03-audits/错题本.md`：
   - 新问题类型 → 追加到 **C（组件类）** 章节末尾
   - 历史错题复现 → 在对应条目「复现记录」追加 `{component} ({date})`
3. 输出审计摘要：P0/P1/P2 各多少条，最严重的 3 个问题是什么

---

## 注意事项

- problems.md 中**每条问题必须包含精确的文件路径和行号**，否则修复 Agent 无法定位
- P0 问题必须有具体代码引用，不得只写「XX 组件有问题」
- **不要**在 problems.md 中写修复建议的实现代码，只记录问题事实
- 组件审计不检查 DB/Server Action 逻辑，那属于 `/audit-module` 的范畴
