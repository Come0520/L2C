# L2C 系统开发最佳实践 (Best Practices)

本文档制定了 L2C 项目的开发规范，旨在统一 **Next.js 16.1 + React 19 + Drizzle ORM** 技术栈下的开发标准，规避业务痛点，确保系统的高可用性、高安全性和全流程类型安全。

---

## 0. 环境与依赖管理 📦

### 0.1 包管理器：pnpm

本项目**强制使用 [pnpm](https://pnpm.io/)** 进行依赖管理，严禁混用 npm 或 yarn。

* **安装依赖**: `pnpm install`
* **添加依赖**: `pnpm add <package>`
* **开发启动**: `pnpm dev`
* **代码检查**: `pnpm lint`

### 0.2 依赖管理原则
*   **Lock 文件**: 必须提交 `pnpm-lock.yaml`，严禁提交 `package-lock.json` 或 `yarn.lock`。
*   **幽灵依赖**: pnpm 严格管理依赖提升，禁止直接引用未在 `package.json` 中声明的依赖。

---

## 1. Server Actions 核心范式：`createSafeAction` 🛡️

所有后端操作（Mutation 和 Query）必须通过 `src/shared/lib/server-action.ts` 中的 `createSafeAction` 包装。

### 1.1 结构化约束
- **输入验证**: 必须提供 Zod Schema，且必须包含用户友好的自定义错误提示（建议中文）。
- **权限拦截**: 每个 Action 必须显式调用 `checkPermission(session, PERMISSIONS.XXX)`。
- **标准化返回**: 必须返回 `ActionState<T>` 结构，由包装器自动处理。

### 1.2 标准代码范式
```typescript
export const updateSomething = createSafeAction(updateSchema, async (data, { session }) => {
    // 1. 权限校验 (第一优先级)
    checkPermission(session, PERMISSIONS.MODULE.EDIT);

    // 2. 核心逻辑 (建议包裹在事务中)
    const result = await db.transaction(async (tx) => {
        // ...执行业务逻辑
        // ...记录系统日志
        return resultData;
    });

    return { success: true, data: result };
});
```

### 1.3 前端解构规范

前端页面或组件在调用时，必须遵循“先解构，后使用”模式。

```typescript
const { success, data, error } = await someAction(params);
if (!success) return toast.error(error);
// 之后安全使用 data
```

---

## 2. “Zero Any” 类型安全准则 ⚛️

严禁在 Action 和页面组件中使用 `any` 类型，必须实现从数据库到 UI 层的全链路类型自动流转。

* **Drizzle 原生推导**: 状态和枚举必须从 Schema 推导，禁止手动硬编码。
* ✅ `status as typeof quotes.status.enumValues[number]`
* ❌ `status as any`


* **公共类型导出**: 在 Feature 模块的 `actions.ts` 顶部导出公共类型别名（如 `QuoteStatus`, `ProductCategory`），供 UI 组件复用。
* **ActionState 泛型**: 通过泛型明确 `TOutput` 类型，确保前端解构时的 Autocomplete 智能提示。

---

## 3. 物理单位标准 📏

### 3.1 长度单位：厘米 (cm)

所有涉及尺寸的字段（如 `width`, `height`, `length`, `hem`, `margin`）必须以**厘米 (cm)** 为单位存储和计算。

* ✅ `width: 150` // 表示 150 厘米
* ❌ `widthMm: 1500` // 禁止使用毫米

### 3.2 金额单位：元 (yuan)

所有涉及金额的字段（如 `price`, `amount`, `cost`, `fee`, `total`）必须以**元 (yuan)** 为单位存储。

* ✅ `totalAmount: '1299.00'` // 表示 1299 元
* ❌ `totalAmountCent: 129900` // 禁止使用分

### 3.3 自动化检测

`l2c-check.ts` 脚本会自动扫描 `schema.ts` 文件，若检测到包含 `mm`, `cent`, `分` 等禁止的单位关键字，将拦截提交。


---

## 3. 数据一致性：事务保护 (db.transaction) 🧱

### 3.1 原子性要求

涉及**两张表及以上**的写入操作（Insert/Update/Delete）必须使用数据库事务。

* **示例场景**：创建订单 + 扣减库存、状态变更 + 写入操作日志。

### 3.2 审计记录

关键业务变更（如调价、删单、权限修改）必须在同一个事务内包含一条 `system_logs` 的插入操作，确保数据变更可追溯。

### 3.3 缓存失效 (Revalidation)

所有 Mutation 操作必须手动触发受影响路径的缓存失效，消除数据更新滞后的幻觉。

* `revalidatePath('/module-list')`; // 刷新列表
* `revalidatePath('/module/[id]')`; // 刷新详情页

---

## 4. 业务完整性：闭环校验 (Business Closure) 🔐

### 4.1 状态机驱动

严禁直接通过 `update` 接口修改 `status` 字段，必须通过语义化的具体 Action 触发状态变更。

* ✅ `approveQuote` (审核报价), `shipOrder` (确认发货)
* ❌ `updateStatus({ status: 'SHIPPED' })`

### 4.2 前置拦截逻辑

在执行关键变更前，必须在服务端进行规则校验。

* **示例**：激活报价单前检查是否有商品明细；财务模块确认收款前检查账单是否已被锁定。

---

## 5. UI/UX 标准：流畅性与状态同步 🎨

* **URL 即状态 (URL as State)**：列表的分页、搜索、筛选参数必须同步至 URL Query Parameters，确保页面可分享、可刷新、可后退。
* **视觉一致性**：严格执行“液态玻璃 (Liquid Glass)”视觉规范，使用统一的 `glass` 样式工具类。
* **加载体验**：为所有异步组件配置对应的 **Skeleton (骨架屏)**，利用 React 19 的 `Suspense` 实现流式渲染。
* **响应速度**：高频交互（如开关、点赞、小额改价）优先使用 `useOptimistic` 进行乐观更新。

---

## 6. 权限防御体系 ⚔️

系统实行“三层防御”机制，确保数据万无一失。

1.  **第一道防线 (Middleware)**：基础登录态拦截，未登录用户无法访问受保护路由。
2.  **第二道防线 (Server Action)**：**核心防线**。在每个操作内部调用 `checkPermission` 进行细粒度权限校验。
3.  **第三道防线 (UI 显隐)**：前端根据权限数据决定按钮或菜单的显示。仅作为 UX 优化，不可替代服务端校验。

---

## 7. 开发检查清单 (Self-Checklist) 📋

开发完成提交前，请逐项检查：

* [ ] 后端操作是否全部包裹在 `createSafeAction` 中？
* [ ] 输入参数是否定义了详细的 Zod Schema 校验？
* [ ] 跨表操作是否使用了 `db.transaction`？
* [ ] 核心业务操作是否记录了 `system_logs`？
* [ ] 代码中是否存在 `any` 关键字？
* [ ] 操作成功后是否调用了 `revalidatePath`？
* [ ] 列表页的查询参数是否已绑定到 URL？
* [ ] UI 层是否为异步请求配置了骨架屏或 Loading 状态？

---

*L2C 项目组 | 最后更新：2026-01-04*