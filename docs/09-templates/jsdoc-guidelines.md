# L2C 项目 JSDoc 编写规范与骨架

为了达到 L5 级别的代码成熟度，所有非纯 UI 组件（特别是 Server Actions, Services, Utils, Hooks）均必须提供符合本规范的 JSDoc。

## 1. 核心原则
- **WHY > WHAT**: 注释重点解释**为什么**要这么写，**前置条件**是什么，**异常**有哪些。代码能自己说明的(WHAT)，不要废话。
- **中文优先**: 描述必须使用中文，技术名词保留英文。

## 2. Server Action 注释骨架
```typescript
/**
 * [此处简述 Action 的业务动作，如：转移线索给其他销售]
 * 
 * @description 
 * [详细描述业务逻辑，限制条件。如：只有管理员或该线索的负责人能转移，转移后会发通知]
 * 
 * @param params.userId - 目标用户 ID
 * @param params.leadId - 线索 ID
 * @param context - 包含当前 session 信息的上下文 (由 createSafeAction 注入)
 * 
 * @throws {BusinessError} 当目标销售账户被禁用时
 * @throws {AuthError} 当无权转移该线索时
 * 
 * @returns 转移后的线索数据
 * 
 * @audit [CREATE/UPDATE/DELETE] - 标记该操作是否会被记录到审计日志中
 */
```

## 3. Service 类/方法 注释骨架
```typescript
/**
 * [Service 类的核心职责]
 */
export class LeadService {
  /**
   * [方法功能简述]
   * 
   * @param params - 参数对象
   * @param tx - (可选) 数据库事务对象。如果不传则使用全局 db
   * @returns 
   */
}
```

## 4. DB Schema 表与字段规范
在 `src/shared/api/schema.ts` 中，每张表和复杂字段（尤其是 JSON / Enum）必须有如下注释：
```typescript
/**
 * [表中文名] 
 * 作用：...
 */
export const myTable = pgTable('my_table', {
  // [字段中文名]：[释义及可能的枚举值说明]
  status: varchar('status').default('PENDING') 
});
```
