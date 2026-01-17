# UI/UX 需求规格说明书 (UI/UX Requirement Specification)

本文档基于 `docs/requirements/` 下的需求文档，汇总整理了系统的 UI/UX 设计要求与交互规范。

## 1. 设计理念与风格 (Design Philosophy & Style)

### 1.1 核心视觉风格 (Visual Identity)
*   **设计语言**: **Aceternity UI** 构建的高端质感界面。
*   **主题策略 (Theming)**:
    *   **Liquid Glass**: 全站默认风格，强调通透感与现代感。
    *   **模式支持**:
        *   **Light Mode (Day)**: 
            *   **背景**: 清新透亮 (#F8FAFC / Slate-50)。
            *   **Glass**: `bg-white/80` + `backdrop-blur-md` (12px) + `border-white/40`。
            *   **文字**: 高对比度 Slate-900 (#0F172A)，禁止用于浅灰 (#94A3B8)。
        *   **Dark Mode (Deep Space Neon)**: 
            *   **背景**: 深空黑 (#050510)。
            *   **主色 (Primary)**: 赛博青 (#00FFFF)。
            *   **辅色 (Secondary)**: 霓虹紫 (#7B61FF)。
            *   **强调 (Accent)**: 激光粉 (#FF00FF)。
            *   **Glass**: `bg-slate-900/60` + `backdrop-blur-xl` + `border-white/10`。

*   **排版 (Typography)**:
    *   **标题 (Headings)**: **Outfit** (Geometric, Modern) - 展现科技感。
    *   **正文 (Body)**: **Inter** (Humanist) - 确保高可读性。

### 1.2 关键组件风格
*   **图标 (Icons)**: 
    *   **规范**: 统一使用 SVG (Heroicons / Lucide)。
    *   **禁忌**: **严禁使用 Emoji** (🎨, 🚀) 作为 UI 图标。
    *   **尺寸**: 固定 viewBox (e.g. `w-5 h-5`), 严禁随意拉伸。
*   **卡片**: 玻璃拟态 (Glassmorphism)，需确保在 Light Mode 下有足够对比度 (border-gray-200)。
*   **按钮**: 动态梯度 (Dynamic Gradient)，支持 Hover 流光效果。
*   **交互 (Interaction)**:
    *   **Cursor**: 所有可点击区域必须设置为 `cursor-pointer`。
    *   **Hover**: 必须有视觉反馈 (透明度/颜色/位移)，过渡时长 `duration-200`。

## 2. 布局与导航 (Layout & Navigation)

### 2.1 全局导航 (Global Navigation)
*   **侧边栏 (Sidebar)**:
    *   **极简设计**: 仅保留核心一级菜单与必要的二级菜单。
    *   **收敛策略**: 移除具体任务入口（如“我的待办”、“预警中心”），统一收敛至工作台。
    *   **结构调整**: “采购单”归入“供应链”模块。
*   **顶部栏 (Top Bar)**:
    *   **全局搜索**: 居中/居右，支持 `Ctrl+K` / `Cmd+K` 快捷键唤起。
    *   **通知中心**: 铃铛图标，区分“系统通知”、“预警”和“@提及”。
    *   **用户菜单**: 头像悬浮/点击展示个人设置与退出。

### 2.2 工作台 (Workbench / Dashboard)
*   **布局模式**: **Tabs 布局**
    *   **Tab 1: 我的待办 (My Todos)**: 聚合该角色所有需处理事项，实现“事找人”。
    *   **Tab 2: 预警中心 (Alert Center)**: 集中展示SLA超时或临期预警。
*   **卡片设计**:
    *   展示任务类型、数量、截止时间。
    *   使用 🔴 (超时) 🟡 (临期) 视觉标签高亮紧急度。
    *   支持点击卡片直接跳转对应业务处理页。

## 3. 交互模式 (Interaction Patterns)

### 3.1 全局交互
*   **全局搜索 (Global Search)**:
    *   **聚合结果**: 按模块分组显示 (线索、订单、任务、客户等)。
    *   **上下文感知**: 在不同页面可能优先展示相关内容。
*   **全局筛选 (Global Filter)**:
    *   **列表页标配**: 位于列表顶部。
    *   **记忆功能**: 本地存储 (LocalStorage) 用户上一次的筛选偏好。
    *   **通用项**: 时间、状态、创建人。
    *   **模块项**: 如 Lead 的“渠道”，Order 的“供应商”。

### 3.2 业务操作交互
*   **数据驱动状态 (Proof of Work)**:
    *   禁止单纯点击改变关键状态。
    *   **必须动作**: 上传照片(测量/安装)、上传凭证(财务)、填单号(发货) 才能驱动状态流转。
*   **可视化配置**:
    *   **审批流**: 拖拽式 (Drag-and-Drop) 流程设计器。
    *   **报价公式**: 可视化配置计算规则。
*   **侧滑/弹窗 (Drawers & Modals)**:
    *   详情查看优先使用侧滑抽屉 (Drawer) 保持上下文。
    *   复杂表单或独立任务使用弹窗 (Modal) 或 独立页面。

### 3.3 反馈机制
*   **Toast**: 瞬时反馈 (成功/失败)，不干扰操作流。
*   **Notification**: 持久化通知，用于通过审批、任务分配等异步事件。

## 4. 模块化 UI 需求 (Module-Specific UI)

### 4.1 测量 (Measurement) - 移动端优先
*   **场景**: 现场手机/Pad 操作。
*   **UI 特点**:
    *   **大按钮 (Big Buttons)**: 方便手指点击，防误触。
    *   **离线模式 (Offline Mode)**: 明确的状态指示（离线/在线/同步中）。
    *   **多媒体上传**: 便捷的照片/视频拍摄与上传入口。

### 4.2 报价 (Quote)
*   **双视图切换**:
    *   **按空间 (By Room)**: 适合跟客户沟通方案 (客厅、卧室...)。
    *   **按品类 (By Category)**: 适合核算成本 (窗帘总长、辅料总量...)。
*   **版本对比**: 清晰展示不同版本 (V1, V2) 的差异。

### 4.3 审批 (Approval)
*   **流程图展示**: 在单据详情页直观展示当前审批进度条或流程图，高亮当前节点。

### 4.4 权限管理 (Admin)
*   **树状图 (Tree View)**: 清晰展示菜单与按钮级权限层级，支持勾选。

## 5. 响应式与适配 (Responsiveness)

### 5.1 布局原则 (Layout Rules)
*   **间距策略**: 采用响应式 Padding，避免移动端过窄。
    *   `px-4 sm:px-6 lg:px-8`
*   **最大宽度**: 统一容器宽度 `max-w-7xl` (1280px) 或 `max-w-screen-2xl` (1536px)，居中对齐 `mx-auto`。
*   **悬浮元素**: 所有的 Floating Navbar / Action Bar 必须留有边距 (`top-4 left-4 right-4`)，严禁贴边。

### 5.2 移动端适配 (Mobile First)
*   **表格处理 (Tables)**:
    *   **严禁** 在移动端出现横向滚动的复杂表格。
    *   **必须** 在 `<md` 屏幕下转换为 **卡片视图 (Card View)**。
    *   若必须保留表格，使用 `overflow-x-auto` 容器包裹。
*   **核心闭环**: 确保 线索录入、测量回传、任务查看 在手机端单手可操作。

## 6. UI/UX 质量控制清单 (QC Checklist)
*交付前必须通过以下检查*

*   **视觉 (Visual)**
    *   [ ] **No Emoji**: 确认没有使用 Emoji 作为图标。
    *   [ ] **Icons**: 所有图标风格统一 (Heroicons/Lucide)，尺寸一致。
    *   [ ] **Contrast**: Light Mode 下文字对比度足够 (Slate-900/600)，Glass 卡片边界清晰。
    *   [ ] **Brand**: 确认 Logo 和品牌色使用正确。
*   **交互 (Interaction)**
    *   [ ] **Cursor**: 所有可点击元素都有 `cursor-pointer`。
    *   [ ] **Hover**: 所有交互元素都有 Hover 态，且过渡平滑 (duration-200)。
    *   [ ] **Focus**: 键盘操作有清晰的 Focus Ring。
*   **布局 (Layout)**
    *   [ ] **Spacing**: 悬浮元素不贴边，内容不被 Navbar 遮挡。
    *   [ ] **Mobile**: 手机端无水平滚动条 (No horizontal scroll)，表格已适配为卡片。
