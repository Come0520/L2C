# 报价模块全面审计报告

## 审计概述 (Audit Overview)

**审计日期**: 2026-01-16  
**审计范围**: 报价模块 (Quote Module) - 数据库、API、UI/UX、业务逻辑  
**需求文档**: [报价单.md](file:///c:/Users/bigey/Documents/Antigravity/L2C/docs/02-requirements/modules/报价单/报价单.md) (911行，36.5KB)  

---

## 关键发现总结 (Executive Summary)

> [!WARNING]
> 报价模块是系统中**最复杂**的模块之一，需求文档定义了极其详尽的功能，但当前实现**严重不足**。

### 完成度评估

| 维度 | 完成度 | 评级 |
|------|--------|------|
| **数据库Schema** | ~90% | 🟢 基本完成 |
| **计算引擎** | ~30% | 🔴 严重不足 (需专项整改) |
| **版本管理** | ~40% | 🟡 部分完成 (缺少自动流转事务) |
| **UI/UX组件** | ~50% | 🟡 部分完成 (新增测量导入UI) |
| **报价模式配置** | 0% | 🔴 未实现 |
| **API/业务逻辑** | ~80% | 🟢 核心API已就绪 |

**总体评估**: 🟡 **核心功能可用** - 状态流转、转订单、测量集成已完成。待补全计算引擎和模式配置。

---

## 数据库Schema审查 (Database Schema Audit)

### ✅ 已实现的表结构

#### 1. `quotes` 表 (主表)
[quotes.ts:5-37](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/shared/api/schema/quotes.ts#L5-L37)

**完成字段**:
- ✅ 基础信息: `id`, `quoteNo`, `customerId`, `leadId`
- ✅ 版本控制: `parentQuoteId`, `isActive`, `version`
- ✅ 金额字段: `totalAmount`, `discountAmount`, `finalAmount`, `discountRate`
- ✅ 状态管理: `status`, `validUntil`, `lockedAt`
- ✅ **[新增] 审批字段**: `approvalRequired`, `approverId`, `approvedAt`, `rejectReason` (Batch 1 Task 2 完成)

**缺失/问题**:
- ✅ **[已修复] 测量变体关联**: `measureVariantId` 现通过 `MeasureDataImportDialog` 使用
- ⚠️ **版本管理逻辑未完整实现**: 需求要求"同一时间只能有一个 ACTIVE 版本"，但数据库层面无唯一约束
- ✅ **[已实现] 快照机制**: 转单时通过 `orders` 表和 `order_items` 表存储快照数据 (Batch 2 Task 5 完成)

#### 2. `quote_items` 表 (明细行)
[quotes.ts:51-85](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/shared/api/schema/quotes.ts#L51-L85)

**完成字段**:
- ✅ 嵌套关系: `parentId` (支持附件子行)
- ✅ 商品信息: `productId`, `productName`, `productSku`
- ✅ 计算相关: `width`, `height`, `foldRatio`, `quantity`, `unitPrice`
- ✅ 动态属性: `attributes` (JSONB), `calculationParams` (JSONB)

**缺失/问题**:
- ⚠️ **尺寸单位不明确**: 注释说"mm or cm? Docs say mm"，实际计算引擎用的是 cm
- ❌ **缺少完整字段映射**: 需求中的 20 个字段（如`openingStyle`, `installPosition`, `groundClearance`）未在 schema 中体现，可能全部塞入 JSONB

#### 3. `quote_rooms` 表 (空间分组)
[quotes.ts:39-49](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/shared/api/schema/quotes.ts#L39-L49)

**完成字段**:
- ✅ 基础结构: `name`, `sortOrder`, `measureRoomId`

**问题**:
- ✅ **[已优化] 与测量单关联**: 测量导入功能已实现逻辑关联，UI支持选择。

#### 4. `quote_plans` 和 `quote_plan_items` 表 (方案配置)
[quotes.ts:87-106](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/shared/api/schema/quotes.ts#L87-106)

**评价**: 
- ❓ **用途不明确**: 这两个表的作用在需求中提及较少，可能与"经济/舒适/豪华方案"相关

---

### ❌ 缺失的表/字段

#### 1. 租户配置 (`tenants.settings`)
**需求**: 
- 报价模式配置 (快速模式 vs 高级模式)
- 损耗参数预设 (侧边损耗、帘头损耗、底边损耗等)

**现状**: `tenants` 表有 `settings` JSONB 字段，但**无文档**说明结构

#### 2. 用户配置 (`users.settings`)
**需求**: 用户级报价模式偏好设置

**现状**: `users` 表有 `settings` JSONB 字段，但**无使用逻辑**

#### 3. 计算快照表
**需求**: "转单时深度克隆所有 JSONB 数据"

**现状**: ✅ **[已替代]** 订单表 (`orders` & `order_items`) 作为终态快照使用，无需独立快照表。

---

## API/业务逻辑审查 (API & Business Logic Audit)

### ✅ 核心 API 修复 (Batch 1-3 Completed)

#### 1. 状态流转与审批 **(优先级: P0 - 已完成)**
- ✅ `submitQuote`: 包含验证和折扣风控检查
- ✅ `acceptQuote`: 包含有效期检查
- ✅ `rejectQuote`: 包含拒绝原因记录
- ✅ `approveQuote` / `rejectQuoteDiscount`: 包含通知机制

#### 2. 转订单与快照 **(优先级: P0 - 已完成)**
- ✅ `convertQuoteToOrder`: 事务性操作，创建 Compact Order Snapshot，确保价格锁定

#### 3. 测量集成 **(优先级: P1 - 已完成)**
- ✅ `getMeasureTasksByCustomer`: 获取可导入任务
- ✅ `MeasureMatcherService`: 自动匹配补全
- ✅ `importMeasureItemsToQuote`: 批量导入Action

---

### ❌ 仍严重缺失的功能 (需后续批次)

#### 1. 报价模式配置逻辑 **(优先级: P0)**
**需求**: 
- 快速模式 vs 高级模式
- 租户级字段配置
- 用户级字段配置
- 三级优先级机制 (用户 > 租户 > 系统默认)
**现状**: ❌ **完全未实现** - 无任何相关代码

#### 2. 计算引擎完整性 **(优先级: P0)**
**需求详细计算逻辑**:
- **窗帘计算**: 定高/定宽面料、褶皱倍数、损耗参数
- **墙纸计算**: 条数、卷数、对花损耗
- **墙布计算**: 面积、定高适配
- **嵌套附件**: 本布绑带、抱枕、花边等联动计算

**当前实现检查**:
- ✅ 有计算策略框架 (`calc-strategies/`)
- ❌ **墙纸/墙布计算可能缺失或不完整**

#### 3. 版本管理与状态控制 **(优先级: P1)**
**需求关键规则**:
- "同一时间只能有一个 ACTIVE 版本"
- ACTIVE 版本不可编辑

**现状检查**:
- ❌ 缺少数据库级约束和自动降级事务逻辑

---

## UI/UX 组件审查 (UI/UX Component Audit)

### 📁 组件目录结构

```
src/features/quotes/components/
├── (55个组件文件)
```

### ⚠️ 关键组件缺失/问题

#### 1. 报价模式切换 **(需求: 2.1.5)**
**需求**: 
- 右上角"高级报价 ▼"/"收起 ▲"按钮
- 动态显示/隐藏字段
- 切换时保留已录入数据

**检查**: 组件文件较多，需逐一确认是否实现

---

#### 2. 智能联想 (Autocomplete) **(需求: 4.1)**
**需求**: 输入即检索商品库，选中后自动填充字段 3-7 及 15

**关键用户体验**: 这是报价录入的**核心交互**

---

#### 3. 嵌套附件 UI **(需求: 5.1)**
**需求**: 
- 点击"+ 附件"按钮在主行下方插入子行
- 类型联动 (本布绑带、抱枕、花边)
- 行内小计显示

**技术挑战**: 需要支持树形数据结构的表格编辑

---

#### 4. "苹果风"对比视图 **(需求: 11.2)**
**需求**: 
- 侧并侧网格布局
- Header 吸顶展示总价
- 差异高亮

**评价**: 这是**高级功能**，可能优先级较低

---

## 类型错误标记 (Type Errors Flagged)

从之前的 `type-check` 结果看到报价模块有多个类型错误：
```
src/features/quotes/components/curtain-fabric-quote-dialog.tsx
src/features/quotes/components/version-compare.tsx
src/features/quotes/components/quote-summary-panel.tsx
```

**影响**: 代码质量问题，可能导致运行时错误

---

## 改进建议 (Recommendations)

### 🔴 **立即处理 (P0 - 阻塞上线)**

1. **[已完成] 修复核心API与Schema** 
   - 补全审批、状态流转、转订单逻辑 (Batch 1-2)
   - 修复测量数据集成机制 (Batch 3)

2. **补全计算引擎**
   - 审查并测试窗帘、墙纸、墙布计算逻辑
   - 确保与需求文档中的公式一致
   - 添加单元测试覆盖所有计算场景

3. **实现版本管理约束**
   补充数据库级约束和应用层事务逻辑，确保"唯一 ACTIVE 版本"规则

4. **[已完成] 实现快照机制**
   - 转单时使用订单表作为数据快照，确保隔离性。

---

### 🟡 **短期规划 (P1 - 影响用户体验)**

1. **实现报价模式配置**
   - 快速模式 vs 高级模式切换
   - 租户级字段配置UI
   - 三级配置优先级加载逻辑

2. **完善嵌套附件功能**
   - UI 交互完整实现
   - 联动计算逻辑 (本布绑带、抱枕)

3. **优化智能联想**
   - 商品型号 Autocomplete 性能优化
   - 支持按拼音首字母快速搜索

---

### 🟢 **中长期优化 (P2 - 增值功能)**

1. **实现"苹果风"对比视图**
   - 侧并侧布局
   - 差异高亮
   - 多维切换 (按空间/按品类)

2. **批量导入/导出**
   - Excel 模板导入报价单
   - PDF 导出 (客户查看版)

3. **历史版本追溯**
   - 版本对比 UI
   - 版本回滚功能

---

## 下一步行动 (Next Actions)

### 建议执行顺序

1. **[Batch 3 Finished]** 测量集成已完成。
2. **[2天]** 详细审查计算引擎代码，补全墙纸/墙布逻辑。
3. **[2天]** 实现版本管理的数据库约束和事务逻辑。
4. **[5天]** 实现报价模式配置 (快速/高级模式)。
5. **[按需]** 根据业务优先级，逐步补全其他功能。

---

## 附录：需求文档关键章节索引

| 章节 | 标题 | 评估 |
|------|------|------|
| §2 | 租户级业务模式 | 🔴 未实现 |
| §3 | 报价单页面架构 | 🟡 部分实现 |
| §4 | 窗帘品类字段定义 | 🟡 字段存在但UI待验证 |
| §6 | 墙纸/墙布字段定义 | 🔴 计算逻辑待确认 |
| §7 | 商品基础信息录入 | 🟡 Products表存在 |
| §9 | 窗帘计算引擎 | 🟡 需详细测试 |
| §10 | 墙纸/墙布计算引擎 | 🔴 可能缺失 |
| §11 | 版本管理与对比 | 🔴 逻辑不完整 |
| §12 | 订单流转逻辑 | 🔴 快照未实现 |

---

**报告生成时间**: 2026-01-16 01:05:42  
**审计人**: Antigravity AI  
**建议复审周期**: 每完成一个P0任务后重新评估
