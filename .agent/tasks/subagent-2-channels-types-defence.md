# 任务单：Subagent 2 - 渠道 (Channels) 模块安全防卫与 Type-Check 净化

## 背景
我们在之前几个模块成功地移除了危险的 `any` 并设置了分页拦截器。当前 `Channels` 模块也面临相似的问题，它处于整个体系极为核准的数据位置。你需要完成代码清洁与泛型对应工作。

## 目标与改动文件

### 1. 前端表单的 Any 清理 `src/features/channels/components/channel-form.tsx`
- 审查文件内是否依然残留使用 `as any` 或者 `@ts-ignore` 等绕过 TS 检查的异味。利用明确的 Zod 泛型或标准 TS 接口重构。
- 因为 `Subagent 1` 极大可能已经向 Zod Validator 内注册了 `version` (可选)，需要确保如果更新发生并发冲突 (抛出含版本冲突标识异常)，能够被 `catch` 或合理反馈，且不触发任何 TS 报错。

### 2.  查询防由于深分页恶意击穿数据库 `src/features/channels/actions/queries.ts`
- 审查 `getChannels` 以及 `getChannelTree` 等核心查询入口。
- 加入防御性代码限制查询数据量，如：`const limit = Math.min(Math.max(pageSize, 1), 100);`。
- 因为这里会频繁利用 `unstable_cache` 缓存树形节点，如无必要不要过度改动缓存逻辑，但是确保查询入参有强保障（Zod 或者手动卡死数值上限）。

## 产出约束
- 添加清晰的 JSDoc，特别指明防剧烈分页攻击。
- 无 `as any`，通过 `pnpm type-check` 不应该引起这部分业务出现全新的错误。
