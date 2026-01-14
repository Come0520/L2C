# L2C 系统开发最佳实践 (Best Practices)

本文档制定了 L2C 项目的开发规范，旨在统一 **Next.js 16.1 + React 19 + Drizzle ORM** 技术栈下的开发标准，规避业务痛点，确保系统的高可用性、高安全性和全链路类型安全。

---

## 1. Server Actions 核心范式：`createSafeAction` 🛡️

所有后端操作（Mutation 和 Query）必须通过 `src/shared/lib/server-action.ts` 中的 `createSafeAction` 包装。

### 1.1 结构化约束
- **输入验证**: 必须提供 Zod Schema，且必须包含用户友好的自定义中文错误提示。
  - *示例*：`width: z.number().min(50, { message: "窗帘宽度不能小于 50cm" })`
- **权限拦截**: 每个 Action 必须显式调用 `checkPermission(session, PERMISSIONS.XXX)`。
- **标准化返回**: 必须返回 `ActionState<T>` 结构，由 `createSafeAction` 自动封装。

### 1.2 标准代码范式a
```typescript
export const updateSomething = createSafeAction(updateSchema, async (data, { session }) => {
    // 1. 权限校验 (第一优先级)
    checkPermission(session, PERMISSIONS.MODULE.EDIT);

    // 2. 核心逻辑 (建议包裹在事务中)
    const result = await db.transaction(async (tx) => {
        // ...执行业务逻辑
        // ...强制记录系统审计日志
        return resultData;
    });

    return { success: true, data: result };
});
```

### 1.3 前端解构规范

前端页面或组件在调用时，必须遵循“先解构，后使用”模式，严禁直接解构 `data` 以免处理缺失的错误状态。

```typescript
const { success, data, error } = await someAction(params);
if (!success) return toast.error(error);
// 之后安全使用 data
```

---

## 2. "Zero Any" 类型安全准则 ⚛️

严禁在 Action 和业务组件中使用 `any` 类型，必须实现从数据库到 UI 层的全链路类型自动流转。

* **Drizzle 原生推导**: 状态和枚举必须从 Schema 推导，禁止手动硬编码字符串。
  - ✅ `status as typeof quotes.status.enumValues[number]`
  - ❌ `status as any`

* **公共类型导出**: 在 Feature 模块的 `actions.ts` 顶部导出公共类型别名（如 `QuoteStatus`, `ProductCategory`），供 UI 组件复用。
* **单位安全性**: 窗帘业务涉及大量物理计算，数据库统一存储为 `integer`（单位：毫米/分），杜绝浮点数精度问题。

---

## 3. 数据一致性：事务保护 (db.transaction) 🧱

### 3.1 原子性要求

涉及**两张表及以上**的写入操作（Insert/Update/Delete）必须使用数据库事务，确保操作要么全部成功，要么全部回滚。

* **示例场景**: 创建订单 + 扣减库存、状态变更 + 写入操作日志。

### 3.2 审计记录

关键业务变更（如调价、删单、权限修改）必须在同一个事务内包含一条 `system_logs` 的插入操作，确保数据变更 100% 可追溯。

### 3.3 缓存失效 (Revalidation)

所有成功执行的 Mutation 必须触发受影响路径的缓存失效，消除数据更新滞后的视觉误差。

* `revalidatePath('/module-list')`; // 刷新列表页
* `revalidatePath('/module/[id]')`; // 刷新特定详情页

---

## 4. 业务完整性：闭环校验 (Business Closure) 🔐

### 4.1 状态机驱动

严禁通过通用的 `update` 接口随意修改 `status` 字段。所有状态变更必须由具有明确语义的 Action 触发。

* ✅ `approveQuote` (审核报价), `shipOrder` (确认发货)
* ❌ `updateStatus({ status: 'SHIPPED' })`

### 4.2 前置拦截逻辑

在执行关键变更前，必须在服务端进行业务规则校验。

* **示例**: 激活报价单前必须检查是否有商品明细；财务确认收款前必须检查账单是否已被锁定。

---

## 5. UI/UX 标准：流畅性与状态同步 🎨

* **URL 即状态 (URL as State)**: 列表的分页、搜索、筛选参数必须同步至 URL Query Parameters，确保页面链接可分享且刷新不丢失状态。
* **视觉一致性**: 严格执行"液态玻璃 (Liquid Glass)"视觉规范，确保 ERP 系统在高压工作下的视觉舒适度。
* **加载体验**: 利用 React 19 的 `Suspense` 与 **Skeleton (骨架屏)** 实现流式渲染，消除布局抖动 (Layout Shift)。
* **响应速度**: 对于高频简单交互，优先使用 `useOptimistic` 钩子进行乐观更新，提升操作丝滑感。

---

## 6. 权限防御体系 ⚔️

系统实行"三层防御"机制，将安全防护前移至 Server Action。

1. **第一道防线 (Middleware)**: 基础登录态拦截，未登录用户无法访问受保护路由。
2. **第二道防线 (Server Action)**: **核心防线**。在每个 Action 内部强制调用 `checkPermission` 进行细粒度权限校验。
3. **第三道防线 (UI 显隐)**: 前端根据权限数据动态显隐按钮。仅作为 UX 优化，严禁将其作为唯一安全手段。

---

## 7. 开发检查清单 (Self-Checklist) 📋

开发提交前，请逐项检查：

* [ ] 后端操作是否全部包裹在 `createSafeAction` 中？
* [ ] Zod Schema 是否定义了中文报错信息？
* [ ] 跨表写入操作是否使用了 `db.transaction`？
* [ ] 关键业务变更是否包含 `system_logs` 审计？
* [ ] 代码中是否完全移除了 `any` 关键字？
* [ ] 操作成功后是否调用了对应的 `revalidatePath`？
* [ ] 列表页的查询参数是否已绑定到 URL？
* [ ] UI 层是否配置了对应的骨架屏 (Skeleton)？

---

*L2C 项目组 | 最后更新：2026-01-04*

---
