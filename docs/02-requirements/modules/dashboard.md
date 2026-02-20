# 工作台 (Dashboard/Workbench) 模块需求文档

## 1. 模块概述
工作台是 L2C 系统的高度动态入口页面，旨在为不同角色的用户提供个性化的业务概览、待办事项提醒和异常预警。它集成了全系统的核心数据流，作为用户每日工作的“驾驶舱”。

## 2. 核心功能清单

### 2.1 统一待办中心 (Unified To-dos)
- **线索跟进**：聚合 `PENDING_FOLLOWUP` 状态的销售线索。
- **订单处理**：展示未锁定的草稿或待审核订单。
- **采购协同**：提醒待下达或草稿状态的采购单。
- **生产执行**：展示分配给用户的待处理生产任务。
- **售后工单**：聚合分配给用户的待处理售后请求。

### 2.2 报警中心 (Alert Center)
- **线索遗忘**：超过 48 小时未触达的公海/私海线索。
- **SLA 违约**：售后工单即将或已经超过承诺响应时间。
- **交货延迟**：采购订单超过预计交货日期未入库。
- **回款预警**：销售订单账期即将逾期。

### 2.3 可配置看板 (Customizable Widgets)
- 支持 21 种 Widget（如：销售目标仪表盘、团队排行榜、现金流分析图等）。
- 用户可根据角色偏好自定义布局（拖拽、显示/隐藏、调整大小）。
- 布局配置通过 `localStorage` 缓存并同步至数据库。

## 3. 角色与权限矩阵

| 功能 / 角色 | ADMIN | MANAGER | SALES | WORKER | FINANCE |
|:---|:---:|:---:|:---:|:---:|:---:|
| 查看全部待办 | ✅ | ✅ | ❌(仅自己) | ❌(仅自己) | ❌ |
| 报警中心详情 | ✅ | ✅ | ❌(仅自己) | ❌ | ✅ |
| 配置全员默认看板 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 访问财务 Widget | ✅ | ✅ | ❌ | ❌ | ✅ |
| 访问生产 Widget | ✅ | ✅ | ✅ | ✅ | ❌ |

## 4. Widget 注册表 (部分摘录)

| 类型 (Type) | 标签 (Label) | 默认宽 | 默认高 | 所需权限 |
|:---|:---|:---:|:---:|:---|
| `sales-target` | 销售目标进度 | 2 | 1 | SALES |
| `team-sales` | 团队销售总览 | 1 | 1 | MANAGER |
| `ar-summary` | 应收账款概览 | 2 | 1 | FINANCE |
| `pending-install` | 待安装统计 | 1 | 1 | DISPATCHER |

## 5. 技术架构与数据流
1. **数据服务层**：`WorkbenchService` 负责高性能并行 SQL 查询及 `unstable_cache` 缓存处理。
2. **API 接口层**：`Next.js Route Handlers` 负责会话校验、租户隔离及异常封装。
3. **前端状态层**：`React Server Components` 请求聚合数据，`Client Components` 处理 Widget 拖拽交互。

## 6. API 规范

### 6.1 获取待办事项
- **接口**：`GET /api/workbench/todos`
- **响应结构**：
```json
{
  "categories": [{ "category": "LEAD", "count": 10, ... }],
  "leads": [...],
  "orders": [...]
}
```

### 6.2 获取报警信息
- **接口**：`GET /api/workbench/alerts`
- **响应结构**：
```json
{
  "categories": [{ "category": "LEAD_OVERDUE", "count": 2, ... }],
  "items": [{ "id": "...", "severity": "error", "title": "..." }]
}
```
