# Subagent 2: API 攻防与访问控制修复任务

## 背景与职责
你在执行一条针对 Leads (线索) 模块的"首轮模块审计"整改任务。你的职责范围专注于**API 安全漏洞的封堵、越权访问的防护、以及异常参数的边界限制**。

**重要前提**：Subagent 1 已经完成了数据库 Schema 层的修改（新增了枚举值 `MEASUREMENT_SCHEDULED`, `QUOTED`, `LOST`, `PENDING_REVIEW` 以及 `importBatchId`, `rawData` 字段），你无需再动这些文件的枚举/字段部分。

**在此次整改中，你需遵循"文档先行"铁律**。如果你发现必须要先修改 `docs/02-requirements/` 下的需求文档才能满足本任务的对齐，请首先修改文档，然后再完成对应的代码。

## 任务列表 (Issues to Fix)

### 1. [Issue 3.1, 3.2] `ilike` 通配符注入漏洞
- **受影响文件**：
  - `src/features/leads/actions/queries.ts`
  - `src/features/leads/actions/scoring.ts`
- **问题说明**：用户输入的搜索关键词直接拼进 `ilike('%${keyword}%')` 模式中，攻击者可以通过注入 `%` 或 `_` 通配符来绕过搜索意图，甚至触发全表扫描造成性能问题。
- **操作要求**：
  - 在这两个文件中找到所有用到 `ilike` 的地方。
  - 创建一个共用的 escape 工具函数（建议放在 `src/shared/lib/sql-utils.ts`），负责对输入中的 `%`, `_`, `\` 这三个字符进行转义。
  - 示例签名：`export function escapeLikePattern(input: string): string`
  - 在所有 `ilike` 调用处使用该函数包裹用户输入。

### 2. [Issue 3.3, 3.4] 分页参数缺少上下界限制
- **受影响文件**：`src/features/leads/schemas.ts` 中的 `leadFilterSchema`
- **问题说明**：`page` 和 `pageSize` 没有设置最大值，攻击者可传入 `pageSize=999999` 造成 OOM / DoS。
- **操作要求**：
  - 对 `pageSize` 增加 `.max(100)` 限制（推荐默认 20）。
  - 对 `page` 增加 `.min(1)` 限制。
  - 确保已有的 API 调用方没有因此改动而破坏（搜索使用该 Schema 的文件检查一下）。

### 3. [Issue 3.5] `releaseToPool` 和 `claimFromPool` 缺少权限校验
- **受影响文件**：`src/features/leads/actions/mutations.ts` 或所有包含这两个函数的文件
- **问题说明**：这两个操作没有基于 `session.user.id` 的所有权或角色检查，任何登录用户理论上都能释放/认领他人的线索。
- **操作要求**：
  - 在 `releaseToPool` 中验证当前用户 `userId === lead.assignedTo`（或拥有 `LEAD.MANAGE` 权限）。
  - 在 `claimFromPool` 中验证线索处于 `PENDING_ASSIGNMENT` 且 `assignedTo` 为空。
  - 使用项目已有的 `checkPermission` 或 `auth()` 模式进行鉴权。

### 4. [Issue 3.6] Cron 路由认证存在时序攻击风险
- **受影响文件**：`src/app/api/cron/leads/pool-recycle/route.ts`
- **问题说明**：`CRON_SECRET` 的比较可能使用了简单的 `===` 字符串比较，存在时序攻击（Timing Attack）风险。
- **操作要求**：
  - 使用 `crypto.timingSafeEqual()` 或 `Buffer` 比较替换现有的 `===` 比较。
  - 示例：
    ```typescript
    import { timingSafeEqual } from 'crypto';
    const expected = Buffer.from(process.env.CRON_SECRET || '');
    const actual = Buffer.from(authHeader || '');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    ```

### 5. [Issue 1.4, 3.7] 移动端 API 手机号脱敏与 `console.log` 清理
- **受影响文件**：`src/app/api/mobile/leads/[id]/route.ts`
- **问题说明**：
  - `customerPhone` 字段在移动端 API 响应中未做脱敏处理。
  - 可能存在 `console.log` 输出了敏感的线索信息。
- **操作要求**：
  - 对 `customerPhone` 做脱敏处理（如 `138****1234`），建议创建 `maskPhone(phone: string): string` 工具函数（可放入 `src/shared/lib/mask-utils.ts`）。
  - 移除所有不必要的 `console.log` 语句，或替换为结构化日志。

### 6. [Issue 3.8, 3.10] UUID 校验与批量去重数量限制
- **受影响文件**：涉及 `leadId` 参数的所有 Action/API 入口；去重检查接口
- **操作要求**：
  - 在接受 `leadId` 的 Zod Schema 中增加 `.uuid()` 校验（如果尚未添加）。
  - 找到批量去重检查的接口，限制单次最多接收 500 条数据（使用 `.max(500)` 约束数组长度）。

---

## 验证计划
完成所有修改后，依次执行：
1. `npx tsc --noEmit` — 确保无类型错误（仅关注 leads 相关文件，其他模块的已有错误可忽略）。
2. `pnpm test:run src/features/leads` — 跑通现有测试（`restore.test.ts` 的已知失败由 Subagent 4 处理，可忽略）。

---

## 你的工作规范
1. **身份声明**：你是 **Subagent 2 (API 攻防与访问控制)**。每次回复用户时，必须在开头第一行注明：`🔒 [Subagent 2 — API 安全]`，以便用户区分不同 Agent 的输出。
2. 不要修改数据库 Schema 文件（`enums.ts`, `leads.ts`）中的枚举或字段定义——那是 Subagent 1 的领地且已完成。
3. 你必须完全采用中文输出思考和反馈进展。
4. 请通过执行本任务所要求的变更，结束后完成自身评审。

> 此任务已准备就绪。当你运行完成且自审通过后，请将进展汇报给用户（作为上级代理司令员）。
