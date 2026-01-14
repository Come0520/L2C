# 需求文档总览

## 目录结构
- [零星需求记录](../requirements/零星需求.md)
- **模块明细**:
  - [线索 (Lead)](../requirements/modules/线索.md)
  - [客户 (Customer)](../requirements/modules/客户.md) *(New)*
  - [测量单 (Measure)](../requirements/modules/测量单.md)
  - [报价单 (Quote)](../requirements/modules/报价单.md)
  - [订单 (Order)](../requirements/modules/订单.md)
  - [采购单 (Purchase Order)](../requirements/modules/采购单.md)
  - [安装单 (Install)](../requirements/modules/安装单.md)
  - [售后 (After-Sales)](../requirements/modules/售后.md) *(New)*
  - [对账单 (Finance)](../requirements/modules/对账单.md)
  - [供应链 (Supply Chain)](../requirements/modules/供应链.md)
- **人员体系**:
  - [销售人员](../requirements/roles/销售人员.md)
  - [派单员](../requirements/roles/派单员.md)
  - [工人](../requirements/roles/工人.md)
- **核心流程**:
  - [销售-测量协同流程](../requirements/workflows/销售_测量_协同.md)
  - [订单-采购-履约流程](../requirements/workflows/订单_采购_履约.md)
  - [订单-发货-安装流程](../requirements/workflows/订单_发货_安装.md)
  - [财务-对账-闭环流程](../requirements/workflows/财务_对账_闭环.md)
- **参考文档**:
  - [状态码速查表](../requirements/状态码速查表.md) *(New)*
  - [数据库 Schema](../database/schema.md) - 完整数据库表结构设计

---

## 核心目标
构建一个模块化的 **L2C (Lead-to-Cash)** SaaS 系统，专为复杂供应链业务（如窗帘行业）设计，支持“搭积木”式的流程组合。

## 业务流程 (Business Flow)
系统需支持多种业务模式的灵活切换：
1.  **纯贸易模式**: 线索 (Lead) -> 报价 (Quote) -> 下单 (Order) -> 收款 (Cash)
2.  **自产自销模式**: 线索 -> 测量 (Measure) -> 报价 -> 生产 (Production) -> 安装 (Install) -> 收款

## 架构需求
1.  **FSD (Feature-Sliced Design)**: 采用分层架构 (Shared, Entities, Features, Widgets, Pages) 保持代码解耦与可维护性。
2.  **模块化引擎**:
    - **Module Registry**: 集中配置模块开关。
    - **策略模式 (Strategy Pattern)**: 处理差异化逻辑（如多种报价公式）。
3.  **多租户与隔离**:
    - 基于 PostgreSQL RLS 的数据强隔离。
    - **功能隔离**: 租户未开启的模块，前端不可见，后端不可查。

## 功能模块规划
- **Core**: 租户/用户/权限 (RBAC)
- **Lead**: 线索管理
- **Measure**: 测量任务调度与记录
- **Quote**: 动态报价引擎 (不同策略)
- **Order**: 订单中心 (状态机驱动)
- **Production**: 生产排程与跟踪
- **Finance**: 资金与结算

## 技术约束
- **Frontend**: Next.js 15 (App Router), Tailwind CSS
- **Backend**: 阿里云 RDS PostgreSQL + Drizzle ORM (RLS, JSONB for dynamic data)
- **Auth**: Auth.js (NextAuth v5)
- **Storage**: 阿里云 OSS
- **Language**: TypeScript
- **Style**: Premium, dynamic, user-centric (Glassmorphism, Micro-animations)
