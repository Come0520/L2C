# [Subagent 3 - 测试债务补全]
> 请在每次发文的起始处，自我声明：`[Subagent 3 - 全链路测试清算]`

## 任务目标
请补全 Customers 模块里高危操作所需的测试防线。
- **任务**: 在 `src/features/customers/actions/__tests__` 目录下，新建或扩充合并行为的测试：`merge.test.ts`。
- **要求**: 
  - 针对 `mergeCustomersAction` 方法实现详细的、全流程覆盖的 `mock`（或沙盒数据库）测试用例。
  - 需要分别测出：1.源客户被软删除、2.目标客户 `totalAmount/orders` 完成累计更新、3.合并日志成功写入对应表、4.因为乐观锁(version不匹配)而触发的合并失败拦截。
  - 完成并确信全部覆盖后，调用 `pnpm test:run src/features/customers` 查看是否 100% 跑通。
  - **重要**: 不要制造 any 类型断言，若引入 `vi.mock`，需按照 Vitest HOISTED 最佳实践实施。

请在阅读业务代码并写完整个测试覆盖后，把最棒的绿灯跑通控制台信息展现给我。
