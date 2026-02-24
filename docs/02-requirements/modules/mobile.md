# 移动端门户 (Mobile Portal) 模块结构白皮书

## 1. 模块边界与定位
`mobile` 模块作为系统级别的核心产品线之一，承载了所有脱离桌面端的操作场景，专门为服务站人员（如测量师、安装工、驻外销售）以及移动化办公的管理者设计。
本模块依托于 Next.js 14 的 App Router，从根目录 `/mobile` 开始独占全局路由生态系。

## 2. 核心板块与路由编排

移动端在结构上被切片为以下几个深度的功能区：

### 2.1 任务中心 (`/mobile/tasks`)
- **定位**：测量工与安装工的工作流处理中枢。
- **状态层级**：支持“待处理 (pending)”、“进行中 (inProgress)” 和 “已完成 (completed)” 的快捷 Tabbing 过滤。
- **组件结构**：由基础的 `TaskCard` 组件作为原子拼装。外围配合 `MobileTasksPage` 处理异步拉取。

### 2.2 审批工作台 (`/mobile/approvals`)
- **定位**：管理者或节点负责人的随身信箱。
- **逻辑模型**：对接后端的审批引擎暴露的轻量化聚合 API。
- **渲染特征**：因应业务审批具有很高的时效性，当节点在加载中时，触发配套的 `approvals/loading.tsx`，即基于 Tailwind 的 `animate-pulse` 骨架屏（Skeleton）过渡。

### 2.3 现场勘测 (`/mobile/measure`)
- **定位**：测量师现场勘测尺寸、记录图纸与客户意向反馈的特化表单。
- **功能预期**：高度依赖云储存、照片上传及快速录入。

### 2.4 其他路由（后续迭代延展）
- **个人中心 (`/mobile/profile`)**
- **统一登录 (`/mobile/login`)** 

## 3. 技术标准与架构规范

### 3.1 UX/UI 体验闭环 (L5 规范级)
1. **统一底座 `layout.tsx`**：使用 `BottomNav` 维持高频刚需路由的快速切换（除登录等非沉浸形态页）。运用安全区域适配 (`safe-area-inset-bottom`) 兼容异形屏与手势返回区。
2. **容错与回退 (`error.tsx` & `loading.tsx`)**：严格贯彻 "Fail Fast, Recover Elegantly" 守则。当网络波动或接口熔断时，交由 `error.tsx` 进行 UI 层拦截；长耗时组件使用骨架屏 (`loading.tsx`) 防止布局抖动 (CLS)。

### 3.2 类型校验防线
全面消除由于 API 设计重构导致的粗放 `<any>` 泛型使用。在 `tasks/page.tsx` 和 `approvals/page.tsx` 严格使用 `interface Task` 与 `interface ApprovalTask` 数据契约进行局部重塑，保障 `map`、`filter` 等操作的高稳态。

### 3.3 测试要求
要求本模块所有入口级页面必须有针对以下三种态势的覆盖断言：
1. **Loading State (加载中)**
2. **Empty State (完全无数据)**
3. **Fulfilled State (数据正常渲染呈现)**
使用 `vitest` 与 `testing-library` 的快照与语义化角色查找法。

## 4. 演进路线图
当前已达成 L5 完全成熟度。
- **阶段一 (已达成)**: 全局容错、骨架屏就绪、Any 清除、用例 100% 通过。
- **阶段二 (规划中)**: 引入 `IndexedDB` 或 PWA 支持无网情况下的任务缓存机制。
