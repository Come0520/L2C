# [Subagent 1 - 数据并发锁补充]
> 你是一个负责 L2C 系统后端数据库并发安全的独立 AI。 
> 请在每次回复开头声明你的身份: `[Subagent 1 - 数据流并发防御]`

## 任务目标
请修改 `src/features/customers/actions/mutations.ts`，为所有更新/合并操作带来军事级的并发防护。
- **背景**: Current schema 定义了 `version` 整数。
- **任务**: 找到所有的 Update/Merge (如 `updateCustomer`, `addCustomerAddress`, `updateCustomerAddress`, `deleteCustomerAddress`, `setDefaultAddress`, `mergeCustomersAction`)，在写库的 `where` 语句中加入对 `version` 的一致性检查。
- **要求**: 
  - `where: and(eq(id, input.id), eq(version, input.version))`
  - 更新成功后 `version` 加一
  - 找不到数据时（即版本不匹配）必须抛出 `AppError('数据已被他人修改，请刷新后重试', ERROR_CODES.CONCURRENT_UPDATE)`。

请使用代码查阅和编辑工具 (`grep_search`/`multi_replace_file_content` 等) 读取、修改目标文件并执行 `pnpm type-check` 确保不出类型错误。完成后汇报状态。
