# 任务单：Subagent 1 - 渠道 (Channels) 数据版本锁与防脏写并发控制

## 背景
当前代码库中 `channels` 模块缺少乐观锁 `version` 字段，且 `mutations.ts` 对并发更新（如两个管理员同时保存一个渠道记录）没有底层设防。你需要填补这块 L5 级别的容错空白。

## 目标与改动文件

### 1. 数据库定义 `src/shared/api/schema/channels.ts`
- 给 `channels` 表增加 `version` 行级锁版本字段：`version: integer('version').default(0).notNull()`，确保跟其他高级模块看齐（如 customers 表）。

### 2. 交互 Schema `src/features/channels/actions/schema.ts`
- 审查 `updateChannelSchema`（如果有独立的），如有必要请追加 `version: z.number().int().min(0).optional()` 以接收前端传回的旧版本号。

### 3. 操作入口 `src/features/channels/actions/mutations.ts`
- **所有 `update` 行动** (例如 `updateChannel` 等)：
  - 查询时的 where 语句需带上乐观锁：`where: and(eq(channels.id, id), eq(channels.version, input.version))`。
  - 数据集 `values` 追加版本自增：`version: sql<number>\`\${channels.version} + 1\``。
- **并发冲突拦截**：
  - 如果传入了 version 但最终影响的行数为 0 (如 update 返回空)，判断为已被其他人修改。你需要显式地 `throw new AppError("数据已被其他人修改，请刷新后重试", "CONCURRENCY_CONFLICT");` 或类似约定的并发报错。

## 产出约束
- 添加必要的 JSDoc，标识该突变经过并发加锁检查。
- 不要出现任何 `as any`，利用 Drizzle 提供的标准 SQL 操作进行。
- 等待 Subagent 2 和 3 完成后会执行 `pnpm test` 和 `pnpm type-check`。
