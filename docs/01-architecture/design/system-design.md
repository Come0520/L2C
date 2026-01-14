# 系统架构设计 (System Architecture Design)

**最后更新日期**: 2026-01-14
**状态**: Approved (已确认)

## 1. 核心架构模式 (Core Pattern)

采用 **"混合单体 (Hybrid Monolith)"** 架构，旨在兼顾 Next.js 在 PC 管理端的全栈开发效率，以及微信小程序在移动端的原生体验需求。

### 1.1 分层架构
为了支持多端接入，系统核心业务逻辑必须从 Next.js 的 Page/Action 层剥离，下沉为独立的 Service 层。

```mermaid
graph TD
    subgraph Clients
        PC[PC Web (Admin)]
        MP[WeChat Mini Program]
    end

    subgraph "Interface Layer (Next.js App Router)"
        SA[Server Actions]
        API[RESTful API (/api/v1/...)]
    end

    subgraph "Service Layer (Core Business Logic)"
        Auth[Auth Service]
        Lead[Lead Service]
        Order[Order Service]
        Notify[Notification Service]
        Permission[RBAC Service]
    end

    subgraph "Data Layer"
        ORM[Drizzle ORM]
        DB[(PostgreSQL)]
        Redis[(Redis Cache)]
    end

    PC -->|RPC| SA
    MP -->|HTTPS| API
    SA -->|Call| Service Layer
    API -->|Call| Service Layer
    Service Layer -->|Query| Data Layer
```

### 1.2 接口策略 (API Strategy)
*   **PC 端 (Internal)**: 优先使用 **Server Actions**。
    *   *优势*: 类型安全 (Vue/React Query 集成方便)，无序列化开销，开发效率极高。
    *   *场景*: 所有的管理后台页面交互。
*   **移动端 (External)**: 建立标准的 **RESTful API**。
    *   *路径*: `src/app/api/v1/[...route]/route.ts`
    *   *认证*: 基于 JWT / Session Token。
    *   *场景*: 微信小程序的所有数据交互。

---

## 2. 移动端策略 (Mobile Strategy)

### 2.1 技术选型
*   **平台**: **微信小程序 (WeChat Mini Program)**。
*   **定位**: 销售现场跟进、师傅上门安装、通过手机快速处理业务。
*   **原因**:
    *   放弃飞书生态，避免依赖第三方办公平台的限制。
    *   不使用 H5/PWA，以获取最佳的相机调用、离线存储和用户体验。

### 2.2 身份认证 (Authentication)
采用 **"账号绑定 + 静默登录"** 模式：

1.  **首次登录**:
    *   用户在小程序输入 PC 端分配的 `username` + `password`。
    *   后端验证通过后，将用户 `OpenID` 写入数据库 `users.wechat_openid` 字段。
2.  **日常登录**:
    *   小程序启动时调用 `wx.login()` 获取 `code`。
    *   后端通过 `code` 换取 `OpenID`，查找匹配用户。
    *   若匹配成功，直接发放 Token 实现静默登录；若失败，跳转至绑定页。

---

## 3. UI/UX 策略 (UI/UX Strategy)

### 3.1 设计语言
*   **核心风格**: **Liquid Glass (液态玻璃)**。
*   **默认主题**: **Deep Space Neon (深空霓虹)**。
    *   *特征*: 深色背景、高斯模糊卡片、霓虹流光边框、高饱和度关键色。

### 3.2 技术实现
*   **主题引擎**: 保留 `next-themes` 架构。
    *   *决策*: 代码层面支持多主题切换（Technical Readiness），但产品层面**锁定**单一默认主题（Product Constraint），暂不开放切换入口，确保能快速上线并打磨极致的视觉效果。
*   **组件库**: **Aceternity UI** (基于 Tailwind CSS + Framer Motion)。

---

## 4. 通知与预警 (Notifications)

鉴于微信小程序订阅消息的限制，采用多渠道分级通知策略。

### 4.1 通道分级
| 优先级 | 场景 | 通道 | 说明 |
|:---|:---|:---|:---|
| **P0 (Critical)** | SLA 超时红色预警、紧急审批 | **短信 (SMS)** | 接入阿里云/腾讯云短信服务，确保必达。 |
| **P1 (High)** | 待办通知、普通审批 | **站内信 (In-App)** | PC 端铃铛图标、小程序首页红点。 |
| **P2 (Normal)** | 系统公告、周报 | **站内信** | 仅列表展示，不主动打扰。 |

### 4.2 短信触发规则
*   **SLA 预警**:
    *   当任务（如测量、发货）超过设定 SLA 时长。
    *   若责任人未处理，发送短信给 **直属上级** (Escalation)。
*   **验证码**:
    *   用于关键操作的二次验证（如果需要）。

---

## 5. 项目结构规范 (Project Structure)

为了支撑上述架构，项目目录需遵循以下规范：

```text
src/
├── app/
│   ├── (dashboard)/        # PC端页面 (Server Components)
│   ├── api/
│   │   └── v1/             # 移动端 REST API 接口
│   └── layout.tsx          # 全局布局 (Theme Provider)
├── features/               # 业务组件 (UI)
├── services/               # [核心] 纯业务逻辑层 (无UI依赖)
│   ├── auth.service.ts
│   ├── leads.service.ts
│   └── ...
├── data/                   # 数据访问层 (DAL)
│   ├── db.ts               # Drizzle 实例
│   └── schema/             # 数据库定义
└── shared/                 # 共享工具
```
