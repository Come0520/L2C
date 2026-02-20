# Customers(客户) 模块首轮八维军事级审计报告

> 审计时间: 2026-02-20
> 审计目标: `customers` 模块全量代码 (`src/features/customers`, `src/shared/api/schema/customers.ts`)
> 审计基准: `docs/02-requirements/modules/客户&渠道`

## 总体健康度评估
- **总体评级**: 🟡 **Substandard (需重点整改)**
- **核心风险**: 缺乏版本乐观锁机制导致并发写入覆盖的风险、单元与 E2E 测试严重缺失导致重构难以验证。
- **亮点**: 查询侧的 `ILIKE` 通配符已做安全转义转义；租户隔离机制基础完备。

---

## 八维审计详情 🎯

### 1. 需求-代码一致性 (Requirement vs Code) 🟡
- **发现**: `version` 乐观锁字段虽在 schema 声明，但在突变逻辑 (`updateCustomer`) 中未查到校验阻击，高并发处理潜在违背。
- **风险**: 客服和销售同时更新同一客户资料会导致相互覆盖更新。

### 2. 业务逻辑与代码质量 (Code Quality & Logic) 🟢
- **发现**: 绝大多数 TypeScript 类型保持严格约束。发现极少量例外：
  - `src/features/customers/components/customer-form.tsx` 存在 `as any` (line 54)。
- **整改建议**: 清除 `any`，修复类型推导。

### 3. 军事级安全 (Security & AuthZ) 🟢
- **发现**:
  - `iliike` 搜索查询中 `%` 和 `_` 已进行了转义（`escapedSearch`）。这是一个很好的基础。
  - 权限判定(`CUSTOMER.ALL_VIEW`, `CUSTOMER.EDIT`, `CUSTOMER.MANAGE`) 已存在。
- **建议**: 继续加固所有的 Server Actions 确认它们都有最严格的参数结构和分页页码数限制 (防止批量数据拖库)。

### 4. 数据库审计 (Database & Schema) 🟡
- **发现**: Schema 中有 `version` 字段，但在 `customers` 的 Actions 里没有被利用作并发控制；某些关联项的空校验可能会抛掷底层报错。
- **整改建议**: 引入在 `updateCustomer` 期间基于 `version` 的一致性检查。

### 5. UI/UX 审计 (UI/UX Quality) 🟡
- **发现**:
  - Customer 表单中存在的强制类型断言暗示可能存在状态/反馈不完美的地方。
  - 需要确保所有的操作（如客户跟进/修改地址），不仅要成功，还要有良好的 Pending 状态以及精确的 Toast 返回信息。
- **整改建议**: 强化 `useAction` 的回调与 Loading 状态遮罩。

### 6. 测试覆盖审计 (Testing Coverage) 🔴 (重点灾区)
- **发现**:
  - 模块内仅包含基础的 `mutations.test.ts`, `queries.test.ts` 与 `customer-audit.test.ts`。
  - **严重缺失**: UI 层面未涵盖组件测试，针对新建、编辑、转介绍及高危的“客户合并 (Merge)”业务逻辑覆盖过少。
- **整改建议**: 增加完善的 `mergeCustomersAction` 的单元集成测试；补齐对表单类型的验证。

### 7. 文档完整性 (Documentation) 🟢
- **发现**: 服务层方法和 Actions 带有基本的注释。可以进一步推广为 JSDoc 的标准格式以配合开发 IDE 环境。

### 8. 可运维性审计 (Operations & Observability) 🟢
- **发现**: 已提供独立的 `customerMergeLogs` 和 `phoneViewLogs` 用于合并和关键信息访问追踪，这是一个非常棒的审计基础。应确保所有的敏感访问都正确落库。

---

## 下一步行动提案 (Next Steps)

基于当前项目的 “全量默认整改” 策略，建议将 Customers 的整改拆分为以下 Subagent：

1. **Subagent 1 (数据与基础架构)**:
   - 补全所有 `mutations.ts` 对 `version` 乐观锁的支持。
   - 检查并补全可能缺失的数据隔离细节。
2. **Subagent 2 (类型纯化与鉴权边界)**:
   - 修复 Component 和测试代码里的 `as any` 类型推导。
   - 复查并补齐各查询接口最大的 Limit 防御性分页。
3. **Subagent 3 (高风险业务链测试补全)**:
   - 强攻补齐“合并客户 (`mergeCustomersAction`)” 和“新建客户”等的关键交互全链路测试。

**请确认是否直接进入该模块的 Plan 撰写与 Subagent 派发环节？**
