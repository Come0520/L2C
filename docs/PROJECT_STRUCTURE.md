# L2C 项目结构与命名规范 (新手指南版)

基于 VibeCoding 5S 原则与当前技术栈 (Next.js 15, Supabase, Taro 3.x) 制定。
本文档旨在帮助团队成员（包括新手）快速理解项目结构，知道代码该往哪里放。

## 1. 全局目录结构 (根目录)

这是整个项目的顶层视图，我们采用“单体仓库”(Monorepo) 的风格，把所有相关代码放在一起管理。

```text
L2C/
├── docs/                     # 📘 项目文档库
│                             # 存放需求文档、设计图、API说明、开发规范等。
│                             # 新人入职第一件事就是读这里的文档。
│
├── scripts/                  # 🛠 自动化脚本
│                             # 存放一些方便开发的命令脚本。
│                             # 例如：一键启动所有服务、数据库备份、环境检查等。
│
├── slideboard-frontend/      # 🖥 Web端应用 (核心项目)
│                             # 使用 Next.js 15 开发的管理后台网站。
│                             # 销售、财务、管理员主要使用这个系统。
│
├── slideboard-mini/          # 📱 小程序端 (待开发)
│                             # 使用 Taro 3.x 开发的微信小程序。
│                             # 方便销售在手机上查看订单、跟进客户。
│
├── supabase/                 # ☁️ 后端与数据库配置
│                             # 这里存放 Supabase 的相关配置。
│                             # 相当于以前的“后端项目” + “数据库脚本”。
│
└── README.md                 # 项目入口说明书
                              # 包含项目简介、如何启动、基本命令等。
```

---

## 2. Web端应用详解 (`slideboard-frontend`)

**技术栈:** Next.js 15 (最新版路由框架), React 19, Tailwind CSS 4 (样式库), Supabase (后端服务)。
**设计模式:** 垂直切片架构 (Feature-Sliced Design) - 简单说就是**按业务功能**来组织代码，而不是按文件类型。

### 核心目录结构映射 (Mapping)

根据 `27状态流程图.md` 定义的业务流程，我们重新规划了目录结构，使其与业务角色和单据状态一一对应。

```text
slideboard-frontend/
├── src/
│   ├── app/                  # 🚦 路由层 (页面导航)
│   │   │                     # 这里的路径直接对应浏览器 URL。
│   │   │
│   │   ├── (auth)/           # 🔐 认证相关 (登录/注册)
│   │   │
│   │   ├── dashboard/        # 📊 工作台 (首页)
│   │   │                     # 包含：待办事项、数据概览、系统通知。
│   │   │
│   │   ├── leads/            # 🎯 线索管理 (对应 SALE/BUSINESS 角色)
│   │   │                     # 包含：线索录入、线索池、分配线索、跟进记录。
│   │   │                     # 状态：待分配 -> 待跟踪 -> 跟踪中 -> 草签
│   │   │
│   │   ├── quotes/           # 📑 报价管理 (对应 SALE/DESIGNER 角色)
│   │   │                     # 包含：创建报价、版本管理、审批申请。
│   │   │                     # 状态：草签 -> 方案待确认
│   │   │
│   │   ├── orders/           # 📦 订单全生命周期管理 (核心模块)
│   │   │   ├── measurements/ # 📏 测量单管理 (对应 SERVICE_MEASURE 角色)
│   │   │   │                 # 状态：待测量 -> 测量中(待分配/分配中/待上门/待确认)
│   │   │   │
│   │   │   ├── installations/ # 🔧 安装单管理 (对应 SERVICE_INSTALL 角色)
│   │   │   │                  # 状态：安装中(待分配/分配中/待上门/待确认) -> 已交付
│   │   │   │
│   │   │   ├── curtain-module/# 🪟 窗帘定制模块 (业务专用)
│   │   │   │
│   │   │   └── status/       # 🔄 状态视图 (根据 26 状态流程图)
│   │   │       └── [status]/ # 动态路由：如 /orders/status/pending_measurement
│   │   │
│   │   ├── products/         # 🛍️ 产品与库存 (对应 DELIVERY_SERVICE 角色)
│   │   │                     # 包含：产品库、库存查询、计算器。
│   │   │
│   │   ├── finance/          # 💰 财务管理 (对应 OTHER_FINANCE 角色)
│   │   │                     # 包含：对账、开票、回款确认。
│   │   │                     # 状态：待对账 -> 待开发票 -> 待回款
│   │   │
│   │   ├── service-supply/   # 🛠 服务供应链 (对应 SERVICE_DISPATCH 角色)
│   │   │                     # 包含：安装师/测量师管理、派单池。
│   │   │
│   │   ├── customers/        # 👥 客户管理 (对应 PARTNER_GUIDE/BUSINESS)
│   │   │                     # 包含：公海池、意向客户、成交客户。
│   │   │
│   │   ├── academy/          # 🎓 知识库 (业务支持)
│   │   │
│   │   └── system/           # ⚙️ 系统设置 (对应 LEAD_ADMIN 角色)
│   │                         # 包含：权限配置、状态规则引擎、审批流配置。
│   │
│   ├── features/             # ✨ 业务逻辑层 (按功能垂直切分)
│   │   │                     # 这里存放实际的业务逻辑代码、状态管理和API调用。
│   │   ├── auth/             # 认证逻辑
│   │   ├── leads/            # 线索逻辑
│   │   ├── orders/           # 订单逻辑 (含测量、安装、状态流转)
│   │   ├── finance/          # 财务逻辑
│   │   └── ...               # 其他模块与 app 目录一一对应
│   │
│   ├── components/           # 🧩 通用组件层 (无业务逻辑)
│   │   ├── ui/               # 基础 UI (Button, Input, Card)
│   │   └── layouts/          # 全局布局 (Sidebar, Header)
│   │
│   └── lib/                  # 🛠 工具库
│       └── supabase/         # 数据库连接工具
│
├── public/                   # 📦 静态资源
├── .env.local                # 🔐 环境变量
└── package.json
```

### 💡 目录与业务角色的对应关系

| 目录路径 (`src/app/`) | 对应主要角色 | 对应核心状态 (26状态) |
|---------------------|-------------|---------------------|
| `/leads` | 销售、业务、销售负责人 | 待分配, 待跟踪, 跟踪中 |
| `/quotes` | 销售、设计师 | 草签, 方案待确认 |
| `/orders/measurements` | 测量师, 派单员 | 待测量, 测量中-待分配/分配中/待上门/待确认 |
| `/orders/installations` | 安装师, 派单员 | 待发货, 已发货, 安装中-待分配/分配中/待上门/待确认, 已交付 |
| `/finance` | 财务 | 待对账, 待开发票, 待回款, 已完成 |
| `/service-supply` | 派单员 | (派单操作) |
| `/products` | 订单客服, 导购 | 待推单, 待下单, 生产中, 备货完成 |

---

## 3. 后端基础设施 (`supabase`)

**技术栈:** Supabase (基于 PostgreSQL 数据库，集成了 认证、存储、即时通讯、云函数)。
**定位:** 这是我们的“云端大脑”。

```text
supabase/
├── functions/                # ⚡️ Edge Functions (云函数)
│   │                         # 这里的代码运行在服务器边缘节点。
│   │                         # 适合处理：Webhooks回调、复杂的定时任务、支付逻辑。
│   ├── order-processing/     # 例如：订单处理函数
│   │   └── index.ts
│   └── notifications/        # 例如：发送通知函数
│
├── migrations/               # 💾 数据库迁移文件 (.sql)
│   │                         # 记录了数据库表结构的所有变更历史。
│   │                         # **严禁手动修改线上数据库**，必须通过这里的文件变更。
│   ├── 20240101000000_init.sql
│   └── 20240102000000_add_profiles.sql
│
├── seed.sql                  # 🌱 种子数据
│                             # 初始化数据库时自动填入的测试数据 (默认账号、字典表等)。
│
└── config.toml               # 本地开发配置
                              # 配置本地 Supabase 服务的端口、密钥等。
```

---

## 4. 小程序端 (`slideboard-mini`)

**技术栈:** Taro 3.x (React 语法), NutUI (组件库)。
**定位:** 手机端应用，主要给销售跑业务用。

```text
slideboard-mini/
├── src/
│   ├── app.config.ts         # 全局配置 (页面路由注册、底部Tab栏配置)
│   ├── app.ts                # 入口文件 (检查更新、初始化)
│   ├── app.scss              # 全局样式
│   │
│   ├── pages/                # 📱 页面目录 (每个页面一个文件夹)
│   │   ├── index/            # 首页
│   │   │   ├── index.tsx     # 页面逻辑
│   │   │   ├── index.config.ts # 页面配置 (标题、导航栏颜色)
│   │   │   └── index.scss    # 页面样式
│   │   └── order/            # 订单页
│   │
│   ├── components/           # 🧩 小程序通用组件
│   │
│   ├── services/             # 🌐 API 服务层
│   │   ├── supabase.ts       # 小程序专用的 Supabase 客户端
│   │   └── api.ts            # 封装好的请求方法
│   │
│   ├── utils/                # 🛠 工具函数
│   ├── hooks/                # 🎣 Hooks
│   └── assets/               # 🖼 图片资源
│
├── config/                   # Taro 打包配置 (一般不用动)
│   ├── index.js
│   ├── dev.js
│   └── prod.js
├── project.config.json       # 微信开发者工具配置文件
└── package.json
```

---

## 5. 命名规范 (强制执行)

为了让代码看起来像是一个人写的，请严格遵守以下命名规则。

| 类型 | 格式 | 示例 (Example) | 说明 |
|------|--------|---------|------|
| **变量 (Variables)** | `camelCase` (小驼峰) | `userData`, `isLoggedIn` | 首字母小写，后面单词首字母大写 |
| **常量 (Constants)** | `SCREAMING_SNAKE` | `MAX_RETRY_COUNT` | 全大写，用下划线分隔 |
| **函数 (Functions)** | `camelCase` (小驼峰) | `fetchOrders()`, `calculateTotal()` | 动词开头，清晰描述功能 |
| **类 (Classes)** | `PascalCase` (大驼峰) | `UserService` | 首字母大写 |
| **组件 (Components)** | `PascalCase` (大驼峰) | `UserProfile.tsx` | 组件文件名和组件名都要大写开头 |
| **普通文件** | `kebab-case` (短横线) | `user-service.ts` | 单词之间用短横线连接 |
| **目录 (文件夹)** | `kebab-case` (短横线) | `user-profile/` | 保持全小写，用短横线分隔 |
| **数据库表名** | `snake_case` (下划线) | `user_orders` | 数据库习惯用下划线 |
| **CSS 类名** | BEM 规范 | `btn--primary` | Block-Element-Modifier 风格 |
