# 任务单：Subagent 3 - 渠道 (Channels) 模块全景测试与安全收尾

## 背景
虽然已经加装了并发锁和安全类型，但必须有自动化的单元测试保障代码变更不被回退，并模拟真实场景。你需要补全 channels 的相关测试。
由于这是一段拥有父子层级的复杂数据（树形），所以必须提供完整的覆盖场景。

## 目标与改动文件

### 1. 建立测试闭环 `src/features/channels/actions/__tests__/mutations.test.ts`
- 建立或追加针对渠道的测试套件。重点测试 `createChannel` 和 `updateChannel`。
- **并发与版本锁反馈**：测试模拟旧的 `version` 值去更新一条已经被更新过的数据，期望正确抛出自定义 `AppError` 错误。
- **树形结构的关联验证**：如果支持建立关联子渠道或者删除父渠道的级联机制，必须要加入相关约束的测试，看它是否正确受阻或成功。
- 在执行 Mock 时（比如 `db.update` 等）确保你设置了适当的 `returning()` 与 `where` 测试分支。

### 2. 测试执行保障
- 修改/创建后的测试代码不能带有 Type-Check 错误。
- 确保护航 `pnpm test:run src/features/channels` 取得全绿（All Passed） 的战果。

## 产出约束
- 如果发现其他 action 文件因先前的 agent 同事修改引发类型报错，允许作为收尾人协助 `tsc --noEmit` 通过。
- 绝不允许使用 `any` 绕开问题。
