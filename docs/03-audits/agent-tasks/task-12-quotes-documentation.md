# Task 12: Quotes 模块文档冲刺 (D4: 6 → 9)

> **目标**：全面补齐 Quotes 报价单模块的文档，使 D4 文档完整性从 6 分提升至 9 分，是 L5 达标的最大缺口。

## 背景与痛点
成熟度报告显示 D4 是 Quotes 模块最大短板（6/10）：
- 有架构设计文档和 README，但**综合功能需求文档尚未覆盖所有已实现功能**
- `QuoteService`（1077行）等公共方法缺少规范的 JSDoc
- Schema 字段注释部分缺失

## 工作目录范围
- `src/features/quotes/` 中的服务层文件（**仅添加注释，不改逻辑**）
- `src/features/quotes/actions/schema.ts` 和 `schemas/` 目录
- `docs/02-requirements/modules/报价单/` 目录

## 任务清单

### 任务 1：编写完整功能需求文档（D4 最大缺口）
在 `docs/02-requirements/modules/报价单/quote-full-requirements.md` 新建文档，需覆盖：
- 所有 14 个功能域（基础CRUD / Bundle / 版本管理 / 折扣风控 / 过期管理 / 模板 / 算料 / 生命周期 / 导出 等）
- 每个功能域写明：**业务规则、输入条件、输出预期、关联操作**
- 可通过读取对应 action 文件的函数名和注释来自动生成

### 任务 2：为 Service 层补充完整 JSDoc
对以下文件的所有 `public` 方法添加中文 JSDoc（参数、返回值、抛出异常、业务说明）：
- `src/features/quotes/quote.service.ts`（重点，1077 行）
- `src/features/quotes/quote-lifecycle.service.ts`
- `src/features/quotes/quote-version.service.ts`
- `src/features/quotes/quote-template.service.ts`（如存在）
- `src/features/quotes/quote-config.service.ts`（如存在）

**JSDoc 示例格式**：
```typescript
/**
 * 创建报价单版本
 * @param quoteId - 报价单 ID
 * @param tenantId - 租户 ID（多租户隔离）
 * @param userId - 操作人 ID
 * @returns 新版本的报价单对象
 * @throws {Error} 当报价单不存在时抛出"报价单不存在"
 * @throws {Error} 当版本数超过上限时抛出"版本已达上限"
 */
```

### 任务 3：Schema 字段中文注释补全
检查 `src/features/quotes/actions/schema.ts` 和相关 Schema 文件，为**所有尚未有 `.describe()` 或注释**的字段补充中文说明。

### 任务 4：验证架构文档一致性
打开 `docs/02-requirements/modules/报价单/2026-01-14-quote-module-architecture-design.md`，与当前代码对比，在文档末尾追加一节"**2026-03-01 更新备注**"，记录与原文不一致的地方（如新增功能、废弃接口等）。

## 验收标准
- `docs/02-requirements/modules/报价单/quote-full-requirements.md` 创建完成且覆盖全部已实现功能
- Service 层核心方法 JSDoc 覆盖率 ≥ 90%
- 架构文档有最新更新备注
- 运行 `npx tsc --noEmit` 零错误（注释不影响编译）

## 交付说明
完成后宣告"Task 12 完成"，汇报新增文档行数与 JSDoc 覆盖情况，等待主线程复核。
