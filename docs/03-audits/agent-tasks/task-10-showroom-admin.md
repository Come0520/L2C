# Task 10: Showroom + Admin 模块 L4 升级 (L3 → L4)

> **目标**：将展厅（Showroom）与管理后台（Admin）两个 L3 模块同步推升至 L4 生产就绪。

## 背景与痛点
- **Showroom (5.9)**：测试覆盖仅 4 个文件，且缺乏完整的业务路径覆盖。Loading/Error 三态缺失。
- **Admin (6.2)**：代码质量优秀（零 TODO/any/@ts-ignore），但需求文档缺失是最大短板（D4 仅 5 分）。同样缺少 Loading/Error UI。

## 工作目录范围
你**只能**修改或添加以下路径下的文件：
- `src/features/showroom/` 及其所有子目录
- `src/features/admin/` 及其所有子目录
- `docs/02-requirements/modules/` 下对应的文档文件（用于 admin 文档生成）

## 核心任务与验收标准

### 任务 1：Showroom 测试补强（D3 提升）
- **要求**：当前仅 4 个测试文件。需要在 `__tests__` 下补充至少 **6 个**核心业务场景的测试用例。重点覆盖展厅内容管理、访客追踪等核心 Actions。
- **验证**：`npx vitest run src/features/showroom` 必须全部通过，新增用例 ≥ 6 个。

### 任务 2：Admin 需求文档自动生成（D4 提升）
- **要求**：通过读取 admin 模块源码（actions 函数签名、Schema 定义、权限配置），自动生成 `docs/02-requirements/modules/管理后台.md`。文档应至少包含：
  - 功能清单（基于 actions 列出所有可用操作）
  - 权限矩阵（基于 checkPermission 调用梳理）
  - 数据模型概览（基于 Schema 梳理）
- **验证**：文档生成完成且内容准确覆盖核心功能。

### 任务 3：两模块 Loading/Error UI 加固（D5 提升）
- **要求**：为 Showroom 和 Admin 模块的所有主路由补充 Skeleton 加载态和 ErrorBoundary 错误边界。确保任意组件的异步数据加载异常不会导致整页白屏。
- **验证**：至少新增 2 个 Skeleton 组件（每模块各 1 个）和对应的 ErrorBoundary。

### 任务 4：Showroom 补充 AuditService（D7 提升）
- **要求**：检查 showroom 的写操作（如展厅内容编辑、发布等），在关键 mutation 中添加 `AuditService.log` 审计留痕。
- **验证**：至少 2 处 AuditService 接入。

## 交付说明
完成后：
1. 运行 `npx tsc --noEmit` 确认无编译错误。
2. 运行 `npx vitest run src/features/showroom src/features/admin` 确认全部通过。
3. 宣告"Task 10 完成"并汇报新增测试数与文档生成情况。
