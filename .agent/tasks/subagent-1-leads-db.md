# Subagent 1: 数据库与核心数据结构修复任务

## 背景与职责
你在执行一条针对 Leads (线索) 模块的“首轮模块审计”整改任务。你的职责范围专注于**数据库 Schema 层、模型枚举值的更新以及 Drizzle 基础设施的对齐**。

**在此次整改中，你需遵循“文档先行”铁律**。如果你发现必须要先修改 `docs/02-requirements/` 下的需求文档才能满足本任务的对齐，请首先修改文档，然后再完成对应的代码。

## 任务列表 (Issues to Fix)

1. **[Issue 1.1, 1.5] 状态机与意向枚举缺失**
   - **现有状态**：`PENDING_ASSIGNMENT, PENDING_FOLLOWUP, FOLLOWING_UP, WON, INVALID`
   - **需增加的新状态**：`MEASUREMENT_SCHEDULED` (已约量尺), `QUOTED` (已报价), `LOST` (战败/流失), `PENDING_REVIEW` (待复核)
   - **操作要求**：
     - 修改 `src/shared/api/schema/enums.ts` （或相应的 enum 定义文件）。
     - 同步修改 Zod Schema `src/features/leads/schemas.ts` 中的 `.enum([...])` 数组。
     - 确保使用这些新状态的业务侧代码不再报错。

2. **[Issue 1.2, 1.6] 批量导入追溯字段缺失**
   - **问题说明**：在批量导入场景下，为了保证出现问题能按批次回滚，并且能够记录原始信息以备排查，在 `leads.ts` Schema 中缺失了追溯追踪字段。
   - **操作要求**：
     - 在 `src/shared/api/schema/leads.ts` 的 `leads` 表中添加 `importBatchId: varchar('import_batch_id', { length: 100 })` 字段。
     - 在 `leads` 表中添加 `rawData: jsonb('raw_data')` 存储原始 JSON。
     - 如果导入工具依赖 Zod Schema 存储验证，同时在 `schemas.ts` 更新可选项。

3. **[Issue 4.2] `status === LOST` 时缺乏强制数据完整性约束**
   - **问题说明**：由于业务需要战败分析，系统在将线索标记为“战败 (`LOST`)”时，强制要求具有丢失原因 (`lostReason`)。
   - **操作要求**：
     - 调整 DB Scheme 时可以依旧允许 `lostReason: text()`（即 nullable）。
     - 但在 **Zod 层或关键业务的更新 Schema**中，添加如 `refine(data => data.status !== 'LOST' || !!data.lostReason, "战败原因必填")` 类似的约束。

4. **[Issue 2.6] 恢复线索时缺失 `updatedAt` 的同步**
   - **问题说明**：在 `src/features/leads/actions/restore.ts` 中恢复逻辑使用 Drizzle `.set(...)` 进行部分更新，但没有包含对 `updatedAt` 的写入，导致审计时间戳陈旧。
   - **操作要求**：
     - 审查该文件的 DB 操作段落，在对象内添加 `updatedAt: new Date()`。

5. **生成与验证执行命令**
   - 全部代码修改结束后，立即运行 `npx drizzle-kit generate` 生成并检查迁移脚本 (`drizzle/`)。
   - 最后执行 `npx tsc --noEmit`。如果报错均和这几个字段或枚举有关，请顺便修复掉它们在其他相关 service 文件中的 TS 类型报错。

---

## 你的工作规范
1. 不要阅读未在你的修改列表中的业务代码以防被混淆。
2. 你必须完全采用中文输出思考和反馈进展。
3. 请通过执行本任务所要求的变更，结束后完成自身评审。

> 此任务已准备就绪。当你运行完成且自审通过后，请将进展汇报给我（作为上级代理司令员）。
