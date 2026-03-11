# 组件审计队列 (Component Audit Queue)

> **调用方式**：
>
> - 审计：`/audit-component component=sidebar` — 生成 `docs/03-audits/components/{component}/problems.md`
> - 修复：`/fix-module module=components/{component}` — 逐条修复 problems.md 中的问题
>
> **状态说明**：⬜ 未审计 | 🔍 审计中 | 📋 待修复 | 🔧 修复中 | ✅ 已完成

---

## 批次 1 — 布局级组件（widgets/layout）

> 目标：全局布局组件，任何一处出现问题都会影响所有页面，优先级最高。

| 优先级 | 组件                     | 路径                                              |  审计状态   |    修复状态     | 备注                                                                         |
| :----: | :----------------------- | :------------------------------------------------ | :---------: | :-------------: | :--------------------------------------------------------------------------- |
| P0 🔴  | sidebar                  | `src/widgets/layout/sidebar.tsx`                  |  ✅ 已完成  |    ✅ 已修复    | 已完成：settings权限、hasModuleAccess、isActive、WORKER/CUSTOMER拦截、持久化 |
| P0 🔴  | header                   | `src/widgets/layout/header.tsx`                   | ✅ 审计通过 | ✅ 已修复 (3/3) | 3 问题 (0P0/1P1/2P2) 性能重构与通信解耦                                      |
| P0 🔴  | user-menu                | `src/widgets/layout/user-menu.tsx`                | ✅ 审计通过 | ✅ 已修复 (7/6) | 6 问题 (1P0/2P1/3P2) 租户切换无确认、any 捕获                                |
| P1 🟠  | header-notification-bell | `src/widgets/layout/header-notification-bell.tsx` | ✅ 审计通过 | ✅ 已修复 (3/3) | 3 问题 (0P0/1P1/2P2) 通知红点与 a11y                                         |
| P0 🔴  | tenant-switcher          | `src/widgets/layout/tenant-switcher.tsx`          | ✅ 审计通过 | ✅ 已修复 (4/4) | 4 问题 (1P0/2P1/1P2) 租户切换无确认                                          |
| P2 🟡  | breadcrumb               | `src/widgets/layout/breadcrumb.tsx`               | ✅ 审计通过 | ✅ 已移除 (1/1) | 1 问题 (已安全移除未使用的 Mock 组件)                                        |
| P2 🟡  | theme-switcher           | `src/widgets/layout/theme-switcher.tsx`           | ✅ 审计通过 | ✅ 已修复 (3/3) | 3 问题 (0P0/1P1/2P2) 注释与 a11y                                             |
| P2 🟡  | sidebar-provider-wrapper | `src/widgets/layout/sidebar-provider-wrapper.tsx` |  ✅ 已完成  |    ✅ 已修复    | 已修复 localStorage 持久化                                                   |

---

## 批次 2 — 高风险业务输入组件（shared/ui）

> 目标：直接接触用户输入的组件，校验逻辑问题会导致脏数据入库。

| 优先级 | 组件                  | 路径                                      |  审计状态   |    修复状态     | 备注                                                          |
| :----: | :-------------------- | :---------------------------------------- | :---------: | :-------------: | :------------------------------------------------------------ |
| P0 🔴  | permission-guard      | `src/shared/ui/permission-guard.tsx`      |  📋 待修复  |        —        | 3 问题 (1P0/1P1/1P2) ⚠️ BOSS/SUPER_ADMIN 通配符漏洞           |
| P0 🔴  | action-confirm-dialog | `src/shared/ui/action-confirm-dialog.tsx` | ✅ 审计通过 | ✅ 已修复 (4/4) | 4 问题 (0P0/2P1/2P2) 已补充回调、a11y 与修复乱码              |
| P1 🟠  | bank-account-input    | `src/shared/ui/bank-account-input.tsx`    | ✅ 审计通过 | ✅ 已修复 (2/2) | 2 问题 (0P0/1P1/1P2) 已修复支持 19 位及数字键盘               |
| P1 🟠  | currency-input        | `src/shared/ui/currency-input.tsx`        | ✅ 审计通过 | ✅ 已修复 (3/3) | 3 问题 (0P0/1P1/2P2) 已修复精度覆盖、数字键盘和默认前缀动态化 |
| P1 🟠  | credit-code-input     | `src/shared/ui/credit-code-input.tsx`     | ✅ 审计通过 | ✅ 已修复 (2/2) | 2 问题 (0P0/1P1/1P2) 已阻止过早校验报错及附加 A11y 属性       |
| P1 🟠  | address-input         | `src/shared/ui/address-input.tsx`         | ✅ 审计通过 | ✅ 已修复 (4/4) | 4 问题 (0P0/2P1/2P2) 已懒加载 JSON，补充最大长度及 A11y 属性  |
| P1 🟠  | multi-select          | `src/shared/ui/multi-select.tsx`          | ✅ 审计通过 | ✅ 已修复 (4/4) | 4 问题 (0P0/2P1/2P2) 已补充虚拟滚动、Map 预构建和文案汉化     |
| P2 🟡  | date-range-picker     | `src/shared/ui/date-range-picker.tsx`     | ✅ 审计通过 | ✅ 已修复 (3/3) | 3 问题 (0P0/1P1/2P2) 已补充跨度天数、上限及 A11y/自适应改进   |
| P2 🟡  | dimension-input       | `src/shared/ui/dimension-input.tsx`       | ✅ 审计通过 | ✅ 已修复 (3/3) | 3 问题 (0P0/1P1/2P2) 无效输入截停 null 与 A11y/iOS 键盘优化   |

---

## 批次 3 — 通用展示组件（shared/ui）

> 目标：影响全局一致性和无障碍体验的展示类组件。

| 优先级 | 组件                  | 路径                                      | 审计状态  | 修复状态 | 备注                                             |
| :----: | :-------------------- | :---------------------------------------- | :-------: | :------: | :----------------------------------------------- |
| P2 🟡  | empty-ui              | `src/shared/ui/empty-ui.tsx`              | 📋 待修复 |    —     | 1 问题 (0P0/0P1/1P2) 缺少 aria-live 空状态播报   |
| P2 🟡  | data-table-pagination | `src/shared/ui/data-table-pagination.tsx` | 📋 待修复 |    —     | 3 问题 (0P0/2P1/1P2) 全英文文案                  |
| P2 🟡  | data-table-toolbar    | `src/shared/ui/data-table-toolbar.tsx`    | 📋 待修复 |    —     | 2 问题 (0P0/1P1/1P2) 占位筛选按钮无功能          |
| P2 🟡  | dashboard-filter-bar  | `src/shared/ui/dashboard-filter-bar.tsx`  | 📋 待修复 |    —     | 1 问题 (0P0/1P1/0P2) 空 Mock 未实现              |
| P2 🟡  | image-preview         | `src/shared/ui/image-preview.tsx`         | 📋 待修复 |    —     | 3 问题 (0P0/1P1/2P2) 注释乱码、无键盘支持        |
| P3 ⚪  | loader                | `src/shared/ui/loader.tsx`                | 📋 待修复 |    —     | 3 问题 (0P0/1P1/2P2) 光敏性闪烁、无 aria-label   |
| P3 ⚪  | alert-dialog          | `src/shared/ui/alert-dialog.tsx`          | 📋 待修复 |    —     | 2 问题 (0P0/0P1/2P2) 按钮样式脱离设计系统        |
| P3 ⚪  | animated-list         | `src/shared/ui/animated-list.tsx`         | 📋 待修复 |    —     | 4 问题 (0P0/2P1/2P2) 全局键盘监听冲突、key=index |

---

_最后更新：2026-03-11_
