# 云展厅 (Showroom) 模块需求文档

> **注意**: 本文档由 `module-audit` Skill 基于现有代码 (`src/features/showroom`) 反向生成，用于补全缺失的需求文档。

## 1. 模块概述
云展厅是销售人员用于向客户展示公司商品、案例、知识和培训资料的核心工具。支持多种内容类型的展示、分享和数据追踪。

## 2. 核心实体

### 2.1 展厅素材 (ShowroomItem)
*   **类型 (Type)**:
    *   `PRODUCT`: 商品 (关联 SKU，展示价格、单位)
    *   `CASE`: 案例 (图文展示)
    *   `KNOWLEDGE`: 知识 (营销话术、技术文档)
    *   `TRAINING`: 培训 (内部培训资料)
*   **属性**: 标题、内容(Markdown)、图片集、标签、关联商品ID、状态(草稿/发布/归档)。
*   **评分 (Score)**: 系统根据完整度自动打分 (0-100)。
    *   基础分: 20
    *   有图片: +20
    *   内容>50字: +20
    *   关联商品: +20
    *   有标签: +20

### 2.2 分享记录 (ShowroomShare)
*   **属性**: 客户ID、销售ID、分享内容快照(Snapshot)、过期时间、访问次数。

## 3. 功能需求

### 3.1 素材管理
*   **列表页**:
    *   支持按类型 (全部/商品/案例/知识/培训) 筛选。
    *   支持按关键词搜索 (标题)。
    *   支持分页加载。
*   **详情页**:
    *   **商品模式 (Product Layout)**: 电商风格，左图右文，展示价格、规格、关联商品。底部展示富文本详情。
    *   **文章模式 (Article Layout)**: 沉浸式阅读，大图 Banner，适用于案例/知识/培训。
*   **创建/编辑**:
    *   支持上传多图。
    *   支持 Markdown 编辑内容。
    *   支持关联系统内的商品 (Product)。
    *   支持打标签。

### 3.2 分享功能
*   **生成分享链接**:
    *   可选择多个素材打包分享。
    *   支持设置有效期 (天数)。
    *   支持针对特定客户生成 (关联 CustomerId)。
    *   **改价功能**: 分享时可临时覆盖商品价格 (Override Price)。
*   **访问追踪**:
    *   记录分享链接的浏览次数 (`views`)。
    *   记录最后访问时间。

### 3.3 权限控制
*   **创建权限**:
    *   默认: 仅管理员 (Admin) 或 产品经理 (Product Manager) 可创建。
    *   例外: 若系统设置 `ENABLE_SHOWROOM_WRITE_FOR_ALL` 开启，则全员可创建。
*   **编辑/删除权限**:
    *   仅 **创建者 (Owner)** 或 **管理员/PM** 可操作。
*   **可见性**:
    *   严格的租户隔离 (`tenantId`)。
    *   培训资料 (`TRAINING`) 在前端有特殊提示 ("仅限内部使用")。

## 4. 现有代码结构映射

| 功能模块 | 关键文件 |
| :--- | :--- |
| **数据模型** | `src/shared/api/schema/showroom.ts` |
| **后端逻辑** | `src/features/showroom/actions/items.ts` (CRUD) |
| **分享逻辑** | `src/features/showroom/actions/shares.ts` |
| **列表界面** | `src/app/(dashboard)/showroom/page.tsx` |
| **详情界面** | `src/app/(dashboard)/showroom/[id]/page.tsx` |
| **组件实现** | `components/showroom-client-page.tsx`, `showroom-detail-client.tsx` |
