# L2C System (Leads to Cash)

[![CI/CD Pipeline](https://github.com/your-username/slideboard-frontend/actions/workflows/test.yml/badge.svg)](https://github.com/your-username/slideboard-frontend/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/your-username/slideboard-frontend/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/your-username/slideboard-frontend)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-8.x-green.svg)](https://eslint.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

基于 Next.js 16+ 和 Supabase 构建的现代化 **L2C (线索到现金)** 全流程管理系统。专为家居软装行业设计，涵盖线索管理、销售跟进、报价、测量、生产、安装到财务对账的全生命周期管理。

## 🚀 核心功能

### 1. 线索管理 (Leads)
- **全渠道接入**: 支持线上/线下线索录入与自动分配
- **智能公海池**: 自动回收超时未跟进线索
- **状态流转**: 可视化看板管理线索状态（待分配 -> 跟踪中 -> 草签 -> 成交）
- **超时预警**: 关键节点（如测量、出图）超时自动报警

### 2. 销售与报价 (Sales & Quotes)
- **多版本报价**: 支持多次修改报价并保留历史版本
- **利润测算**: 实时计算毛利率，辅助销售决策
- **电子合同**: 在线生成合同并支持电子签名

### 3. 交付管理 (Delivery)
- **测量调度**: 测量师排班与任务指派，支持移动端回传数据
- **安装管理**: 安装工派单、现场签到、安装验收与评价
- **进度追踪**: 实时查看每个订单的生产与物流状态

### 4. 财务管理 (Finance)
- **对账中心**: 自动生成对账单，支持批量核销
- **业绩计算**: 自动计算销售提成与安装费
- **发票管理**: 进销项发票管理

## 🛠️ 技术架构

- **前端框架**: Next.js 16 (App Router), React 19, TypeScript
- **样式方案**: Tailwind CSS v4 (OKLCH Color Space)
- **后端服务**: Supabase (PostgreSQL, Edge Functions, Realtime, Storage, Auth)
- **状态管理**: React Query (TanStack Query)
- **UI 组件库**: 自研 Paper UI (基于 Radix UI)

## 📦 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 配置 Supabase：
   - 在 `.env.local` 中填写 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 确保数据库表结构已应用（请参考 `supabase/migrations` 目录）

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── (auth)/             # 认证相关页面
│   ├── leads/              # 线索管理模块
│   ├── orders/             # 订单管理模块
│   ├── installations/      # 安装管理模块
│   └── dashboard/          # 仪表盘
├── components/             # 通用组件
│   ├── ui/                 # 基础 UI 组件 (Paper UI)
│   └── ...
├── features/               # 业务功能模块 (按领域划分)
│   ├── leads/              # 线索相关组件与逻辑
│   ├── orders/             # 订单相关组件与逻辑
│   └── ...
├── services/               # API 服务层 (Supabase 客户端封装)
├── shared/                 # 共享类型与工具
└── lib/                    # 核心库配置 (Supabase, Utils)
```

## 🔒 权限与安全

系统采用 Supabase RLS (Row Level Security) 进行数据访问控制：
- **销售**: 仅能访问分配给自己的线索和订单
- **测量/安装师**: 仅能访问分配给自己的任务
- **管理员**: 拥有全局数据访问权限

## 🤝 贡献指南

请参考 [TESTING_GUIDELINES.md](./TESTING_GUIDELINES.md) 了解测试规范。
