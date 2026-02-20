# Subagent 3: UI/UX 反馈及文档完善任务

## 背景与职责
你在执行一条针对 Leads (线索) 模块的"首轮模块审计"整改任务。你的职责范围专注于**前端交互体验优化、死代码清理、JSDoc 补全以及审计日志完善**。

**重要前提**：
- Subagent 1 已完成数据库 Schema 修改（新枚举值、新字段）。
- Subagent 2 将并行处理安全相关问题。你的工作区域不与之冲突。

**在此次整改中，你需遵循"文档先行"铁律**。如果你发现必须要先修改 `docs/02-requirements/` 下的需求文档才能满足本任务的对齐，请首先修改文档，然后再完成对应的代码。

## 任务列表 (Issues to Fix)

### 1. [Issue 1.3] Server Action 乐观锁 `version` 的支持
- **受影响文件**：`src/features/leads/actions/mutations.ts`
- **问题说明**：当前的更新操作没有传递 `version` 字段做乐观并发控制，多人同时编辑同一线索时可能出现"后写覆盖"的问题。
- **操作要求**：
  - 在 leads 的关键更新 Action（如 `updateLead`, `assignLead` 等）中，接受一个可选的 `version` 参数。
  - 在 Drizzle 的 `.where()` 子句中追加 `eq(leads.version, inputVersion)` 条件。
  - 如果更新影响行数为 0，返回错误提示："数据已被他人修改，请刷新后重试"。
  - **注意**：如果 `leads` 表中尚无 `version` 字段，请先在 `src/shared/api/schema/leads.ts` 中添加 `version: integer('version').default(1).notNull()`，并在更新时做 `version: sql\`version + 1\`` 的自增。这种情况下需要运行 `pnpm db:generate` 生成迁移。

### 2. [Issue 2.1] 死代码清理
- **受影响文件**：
  - `src/features/leads/logic/pool-recycle-job.ts`（或类似文件）
  - 其他 leads 目录下的文件
- **问题说明**：审计发现了一些未被引用的函数、被注释掉的代码块。
- **操作要求**：
  - 在 `src/features/leads/` 目录下搜索以下特征的代码并清理：
    - 被注释掉的大段代码块（超过 5 行的注释代码）
    - 未被任何文件 import 的导出函数
    - `// TODO` 或 `// FIXME` 中已过时的标注
  - **谨慎操作**：对于不确定是否仍在使用的函数，先用全局搜索 (`grep`) 确认无引用再删除。

### 3. [Issue 5.1] 状态转移及分配操作的异步反馈
- **受影响文件**：leads 相关的前端组件（如 `src/features/leads/components/` 下的文件）
- **问题说明**：部分线索操作（如状态变更、分配、释放）缺少标准的加载状态提示和成功/失败 Toast 反馈。
- **操作要求**：
  - 检查 leads 模块中所有调用 Server Action 的组件。
  - 确保每个操作都有：
    - 操作进行中的 loading 状态（按钮 disabled + 加载图标）
    - 成功时的 `toast.success('操作成功')` 反馈
    - 失败时的 `toast.error(error.message || '操作失败')` 反馈
  - 使用项目已有的 `sonner` toast 组件（`import { toast } from 'sonner'`）。

### 4. [Issue 7.1] JSDoc 注释补全
- **受影响文件**：
  - `src/features/leads/actions/mutations.ts`
  - `src/features/leads/actions/queries.ts`
- **问题说明**：关键的 Server Action 缺少标准的 JSDoc 文档注释。
- **操作要求**：
  - 为这两个文件中所有 `export` 的函数添加标准 JSDoc：
    ```typescript
    /**
     * 创建新线索
     * 
     * 业务规则：
     * 1. 自动根据分配策略进行分配
     * 2. 创建后状态为 PENDING_ASSIGNMENT
     * 
     * @param input - 线索创建表单数据
     * @returns 创建结果，包含新线索 ID
     * @throws 权限不足或数据校验失败时抛出异常
     */
    ```
  - **注意**：JSDoc 内容必须使用中文编写。

### 5. [Issue 8.1] 状态历史 (History) 审计记录完善
- **受影响文件**：所有会修改线索 `status` 字段的 Server Action
- **问题说明**：部分状态切换操作没有正确写入 `leadStatusHistory` 表，导致审计追踪不完整。
- **操作要求**：
  - 找到所有会修改 `leads.status` 的 Action。
  - 确保每次状态变更都同时向 `leadStatusHistory` 表写入一条记录，包含：
    - `tenantId`, `leadId`, `oldStatus`, `newStatus`, `changedBy`, `reason`
  - 特别关注新增的状态转移路径（如转到 `MEASUREMENT_SCHEDULED`, `QUOTED`, `LOST`）。

---

## 验证计划
完成所有修改后，依次执行：
1. `npx tsc --noEmit` — 确保无类型错误（仅关注 leads 相关文件）。
2. 如果添加了 `version` 字段，需运行 `pnpm db:generate` 生成迁移脚本。

---

## 你的工作规范
1. **身份声明**：你是 **Subagent 3 (UI/UX 与文档)**。每次回复用户时，必须在开头第一行注明：`🎨 [Subagent 3 — UI/UX & 文档]`，以便用户区分不同 Agent 的输出。
2. 不要修改数据库 Schema 的枚举部分——那是 Subagent 1 的领地且已完成。
3. 不要修改安全/鉴权相关逻辑——那是 Subagent 2 的领地。
4. 你必须完全采用中文输出思考和反馈进展。
5. 请通过执行本任务所要求的变更，结束后完成自身评审。

> 此任务已准备就绪。当你运行完成且自审通过后，请将进展汇报给用户（作为上级代理司令员）。
